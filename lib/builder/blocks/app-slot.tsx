import type { BlockDefinition, ComponentSettings } from "../types";

function AppSlot({ settings }: { settings: ComponentSettings }) {
  return <div data-app-block={String(settings.appHandle || "unassigned")} data-app-target={String(settings.target || "storefront.section")} className="rounded-xl border border-dashed border-black/20 bg-black/[.025] p-4 text-sm"><strong>{String(settings.title || "App block")}</strong><p className="mt-1 opacity-60">{String(settings.description || "An approved app can render content in this controlled slot.")}</p></div>;
}

const block: BlockDefinition = {
  kind: "block",
  type: "app-slot",
  name: "App block",
  version: 1,
  presets: [{ name: "App block" }],
  defaults: { title: "App block", description: "Connect an approved app to this slot.", appHandle: "unassigned", target: "storefront.section" },
  fields: [
    { key: "title", label: "Label", type: "text" },
    { key: "description", label: "Fallback message", type: "textarea" },
    { key: "appHandle", label: "App handle", type: "text" },
    { key: "target", label: "Extension target", type: "select", options: [{ label: "Storefront section", value: "storefront.section" }, { label: "Product details", value: "storefront.product" }, { label: "Cart", value: "storefront.cart" }] },
  ],
  component: AppSlot,
};

export default block;
