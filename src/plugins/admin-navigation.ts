import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";

export type PluginAdminNavigationItem = {
  id: `plugin:${string}`;
  label: string;
  href: string;
  section?: string;
  icon?: string;
  requiresAnyCapability?: readonly Capability[];
  workspaceTypes?: readonly WorkspaceType[];
};

// Phase 13 will generate this list from installed plugin manifests. Keeping the
// extension contract here means plugins never import or edit AdminShell.
export const installedPluginNavigation: readonly PluginAdminNavigationItem[] = [];

