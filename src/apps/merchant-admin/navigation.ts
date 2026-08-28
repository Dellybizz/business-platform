import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";
import { installedPluginNavigation, type PluginAdminNavigationItem } from "@/src/plugins/admin-navigation";

export type AdminNavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  mobile?: boolean;
};

export type AdminNavigationGroup = { id: string; label?: string; items: AdminNavigationItem[] };

type Context = { type: WorkspaceType; capabilities: readonly Capability[] };

const has = (context: Context, capability: Capability) => context.capabilities.includes(capability);

export function buildAdminNavigation(
  context: Context,
  pluginItems: readonly PluginAdminNavigationItem[] = installedPluginNavigation,
): AdminNavigationGroup[] {
  const commerce = has(context, "catalog") || has(context, "checkout") || has(context, "pos");
  const contentLabel = has(context, "catalog") ? "Products" : has(context, "services") ? "Services" : context.type === "cv" ? "Experience" : "Projects";
  const requestLabel = has(context, "checkout") ? "Orders" : has(context, "bookings") ? "Bookings & enquiries" : "Enquiries";
  const contactLabel = commerce ? "Customers" : "Contacts";

  const groups: AdminNavigationGroup[] = [
    {
      id: "main",
      items: [
        { id: "home", label: "Home", href: "/dashboard", icon: "home", mobile: true },
        { id: "requests", label: requestLabel, href: "/inbox", icon: "inbox", mobile: true },
        { id: "content", label: contentLabel, href: "/content", icon: "content", mobile: true },
        { id: "contacts", label: contactLabel, href: "/contacts", icon: "contacts" },
        { id: "analytics", label: "Analytics", href: "/analytics", icon: "analytics" },
      ],
    },
    {
      id: "website",
      label: "Website",
      items: [
        { id: "website-overview", label: "Website", href: "/site", icon: "website", mobile: true },
        { id: "visual-editor", label: "Visual editor", href: "/builder", icon: "editor" },
        { id: "pages", label: "Pages", href: "/pages", icon: "pages" },
        { id: "themes", label: "Themes", href: "/themes", icon: "themes" },
      ],
    },
  ];

  const channels: AdminNavigationItem[] = [];
  if (has(context, "checkout")) channels.push({ id: "online-store", label: "Online Store", href: "/online-store", icon: "store" });
  if (has(context, "pos")) channels.push({ id: "point-of-sale", label: "Point of Sale", href: "/pos", icon: "pos" });
  if (channels.length) groups.push({ id: "sales-channels", label: "Sales channels", items: channels });

  const visiblePlugins = pluginItems.filter((item) => {
    if (item.workspaceTypes && !item.workspaceTypes.includes(context.type)) return false;
    if (item.requiresAnyCapability && !item.requiresAnyCapability.some((capability) => has(context, capability))) return false;
    return true;
  });
  const pluginGroups = new Map<string, AdminNavigationItem[]>();
  for (const item of visiblePlugins) {
    const section = item.section || "Apps";
    const values = pluginGroups.get(section) || [];
    values.push({ id: item.id, label: item.label, href: item.href, icon: item.icon || "plugin" });
    pluginGroups.set(section, values);
  }
  for (const [label, items] of pluginGroups) groups.push({ id: `plugin-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label, items });

  groups.push({
    id: "system",
    items: [
      { id: "apps", label: "Apps", href: "/apps", icon: "apps" },
      { id: "settings", label: "Settings", href: "/settings", icon: "settings", mobile: true },
    ],
  });
  return groups;
}

export function flattenAdminNavigation(groups: readonly AdminNavigationGroup[]) {
  return groups.flatMap((group) => group.items);
}
