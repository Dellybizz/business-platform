import { env } from "cloudflare:workers";
import {
  isEntitlementStatus,
  isServiceProduct,
  hasUsableService,
  serviceCatalog,
  type EntitlementStatus,
  type ServiceEntitlement,
  type ServiceProduct,
} from "./model";
import type { TenantContext } from "@/lib/auth/tenant";

type EntitlementRow = {
  service: string;
  status: string;
  activatedAt: number;
  trialEndsAt: number | null;
  suspendedAt: number | null;
  cancelledAt: number | null;
  updatedAt: number;
};

export async function listServiceEntitlements(workspaceId: string): Promise<ServiceEntitlement[]> {
  const rows = await env.DB.prepare(
    `SELECT service, status, activated_at AS activatedAt, trial_ends_at AS trialEndsAt,
      suspended_at AS suspendedAt, cancelled_at AS cancelledAt, updated_at AS updatedAt
     FROM workspace_service_entitlements WHERE workspace_id = ? ORDER BY activated_at, service`,
  ).bind(workspaceId).all<EntitlementRow>();
  return rows.results.flatMap((row) => isServiceProduct(row.service) && isEntitlementStatus(row.status)
    ? [{ ...row, service: row.service, status: row.status }]
    : []);
}

export function requireServiceEntitlement(ctx: TenantContext, service: ServiceProduct) {
  if (!hasUsableService(ctx.workspace.services, service)) {
    throw Response.json({ error: `${serviceCatalog[service].label} is not active for this workspace` }, { status: 403 });
  }
  return ctx;
}

export function requireAnyServiceEntitlement(ctx: TenantContext, services: readonly ServiceProduct[]) {
  if (!services.some((service) => hasUsableService(ctx.workspace.services, service))) {
    throw Response.json({ error: "An active service is required for this action" }, { status: 403 });
  }
  return ctx;
}

const allowedTransitions: Record<EntitlementStatus, readonly EntitlementStatus[]> = {
  trial: ["active", "suspended", "cancelled"],
  active: ["suspended", "cancelled"],
  suspended: ["active", "cancelled"],
  cancelled: ["active", "trial"],
};

export function canTransitionEntitlement(from: EntitlementStatus, to: EntitlementStatus) {
  return from === to || allowedTransitions[from].includes(to);
}

export async function setServiceEntitlement(input: {
  workspaceId: string;
  service: ServiceProduct;
  status: EntitlementStatus;
  trialEndsAt?: number | null;
}) {
  const existing = await env.DB.prepare(
    "SELECT status FROM workspace_service_entitlements WHERE workspace_id = ? AND service = ?",
  ).bind(input.workspaceId, input.service).first<{ status: string }>();
  if (existing && isEntitlementStatus(existing.status) && !canTransitionEntitlement(existing.status, input.status)) {
    throw Response.json({ error: `Cannot change service from ${existing.status} to ${input.status}` }, { status: 409 });
  }
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO workspace_service_entitlements
      (workspace_id, service, status, activated_at, trial_ends_at, suspended_at, cancelled_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(workspace_id, service) DO UPDATE SET
       status = excluded.status,
       trial_ends_at = excluded.trial_ends_at,
       suspended_at = excluded.suspended_at,
       cancelled_at = excluded.cancelled_at,
       updated_at = excluded.updated_at`,
  ).bind(
    input.workspaceId,
    input.service,
    input.status,
    now,
    input.status === "trial" ? input.trialEndsAt ?? now + 14 * 86400000 : null,
    input.status === "suspended" ? now : null,
    input.status === "cancelled" ? now : null,
    now,
  ).run();
}
