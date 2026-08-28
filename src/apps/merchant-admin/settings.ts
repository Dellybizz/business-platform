import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";

export type SettingsCategory = {
  id: string;
  label: string;
  description: string;
  icon: string;
  requiresAnyCapability?: readonly Capability[];
  businessOnly?: boolean;
};

export const settingsCategories: readonly SettingsCategory[] = [
  { id: "business", label: "Business details", description: "Name, category and business identity", icon: "business" },
  { id: "services", label: "Services", description: "Activate Website, POS or your selected site service", icon: "services" },
  { id: "users", label: "Users and permissions", description: "Invite staff and manage access", icon: "users" },
  { id: "locations", label: "Locations", description: "Business, stock and POS locations", icon: "locations", requiresAnyCapability: ["catalog", "pos", "services"] },
  { id: "domains", label: "Domains", description: "Connected domains and DNS status", icon: "domains" },
  { id: "payments", label: "Payments", description: "Payment providers and methods", icon: "payments", requiresAnyCapability: ["checkout", "pos"] },
  { id: "checkout", label: "Checkout", description: "Customer and order preferences", icon: "checkout", requiresAnyCapability: ["checkout"] },
  { id: "shipping", label: "Shipping and delivery", description: "Delivery zones, rates and pickup", icon: "shipping", requiresAnyCapability: ["checkout"] },
  { id: "taxes", label: "Taxes", description: "Tax regions and calculation policies", icon: "taxes", requiresAnyCapability: ["checkout", "pos"] },
  { id: "notifications", label: "Notifications", description: "Business and customer messages", icon: "notifications" },
  { id: "files", label: "Files", description: "Uploaded images and documents", icon: "files" },
  { id: "billing", label: "Plans and billing", description: "Plan, usage and billing history", icon: "billing" },
  { id: "custom-data", label: "Custom data", description: "Structured fields for your workspace", icon: "custom-data" },
  { id: "apps", label: "Apps", description: "Installed apps and permissions", icon: "apps" },
];

export function settingsForWorkspace(type: WorkspaceType, capabilities: readonly Capability[]) {
  const personal = type === "cv" || type === "portfolio";
  return settingsCategories.filter((category) => {
    if (category.businessOnly && personal) return false;
    if (category.requiresAnyCapability && !category.requiresAnyCapability.some((capability) => capabilities.includes(capability))) return false;
    return true;
  });
}
