import { requireTenant } from "@/lib/auth/tenant";
import { requirePermission } from "@/src/core/authorization/service";
import { writeAuditEvent } from "@/src/core/audit/service";
import {
  capabilitiesForServices,
  isEntitlementStatus,
  isServiceProduct,
  serviceCatalog,
  servicesForWorkspaceType,
  type EntitlementStatus,
  type ServiceProduct,
} from "@/src/core/entitlements/model";
import { listServiceEntitlements, setServiceEntitlement } from "@/src/core/entitlements/service";
import { env } from "cloudflare:workers";

export async function GET() {
  try {
    const ctx = await requirePermission(await requireTenant(), "workspace.read");
    return Response.json({
      catalog: servicesForWorkspaceType(ctx.workspace.type).map((service) => ({ service, ...serviceCatalog[service] })),
      entitlements: ctx.workspace.services,
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requirePermission(await requireTenant(), "services.manage");
    const body = await request.json() as { service?: unknown; status?: unknown; trialEndsAt?: unknown };
    if (!isServiceProduct(body.service) || !servicesForWorkspaceType(ctx.workspace.type).includes(body.service)) {
      return Response.json({ error: "This service is not available for the workspace" }, { status: 400 });
    }
    if (!isEntitlementStatus(body.status)) return Response.json({ error: "Invalid service status" }, { status: 400 });
    const service: ServiceProduct = body.service;
    const status: EntitlementStatus = body.status;
    await setServiceEntitlement({
      workspaceId: ctx.workspace.id,
      service,
      status,
      trialEndsAt: typeof body.trialEndsAt === "number" ? body.trialEndsAt : null,
    });
    const entitlements = await listServiceEntitlements(ctx.workspace.id);
    const usableServices = entitlements.filter((item) => item.status === "active" || (item.status === "trial" && (!item.trialEndsAt || item.trialEndsAt > Date.now()))).map((item) => item.service);
    const requiredCapabilities = capabilitiesForServices(usableServices);
    const now = Date.now();
    await env.DB.batch(requiredCapabilities.map((capability) => env.DB.prepare(
      "INSERT OR IGNORE INTO workspace_capabilities (workspace_id, capability, enabled_at) VALUES (?, ?, ?)",
    ).bind(ctx.workspace.id, capability, now)));
    await writeAuditEvent({ workspaceId: ctx.workspace.id, actorUserId: ctx.user.id, action: `service.${status}`, targetType: "service", targetId: service, metadata: { status } });
    return Response.json({ ok: true, entitlements });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof Response) return error;
  return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
}
