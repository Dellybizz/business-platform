import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";
import type { ServiceEntitlement } from "@/src/core/entitlements/model";

type WorkspaceSummary = {
  id: string;
  name: string;
  type: WorkspaceType;
  role: string;
};

export type WorkspaceApiData = {
  workspace?: {
    id: string;
    name: string;
    slug: string;
    type: WorkspaceType;
    capabilities: Capability[];
    services: ServiceEntitlement[];
    themeId?: string;
  };
  workspaces?: WorkspaceSummary[];
  page?: { status: string } | null;
  summary?: { items: number; requests: number; customers: number; unread: number };
};

const requests = new Map<string, Promise<WorkspaceApiData>>();

export function loadWorkspace(page = "home") {
  const key = page || "home";
  const existing = requests.get(key);
  if (existing) return existing;
  const url = key === "home" ? "/api/workspace" : `/api/workspace?page=${encodeURIComponent(key)}`;
  const request = fetch(url)
    .then(async (response) => {
      const data = await response.json() as WorkspaceApiData;
      if (!response.ok) throw new Error("Unable to load workspace");
      return data;
    })
    .catch((error) => {
      requests.delete(key);
      throw error;
    });
  requests.set(key, request);
  return request;
}

export function invalidateWorkspace() {
  requests.clear();
}
