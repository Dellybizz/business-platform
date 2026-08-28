"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppWindow, Bell, Boxes, Building2, Check, ChevronRight, CircleDollarSign, Cloud, CreditCard, Database, FileStack, Globe2, MapPin, PackageCheck, ReceiptText, Store, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workspacePresets, type Capability, type WorkspaceType } from "@/src/core/workspaces/model";
import { settingsForWorkspace, type SettingsCategory } from "@/src/apps/merchant-admin/settings";
import { TeamManager } from "@/components/platform/team-manager";

const icons = { business: Building2, users: Users, locations: MapPin, domains: Globe2, payments: CreditCard, checkout: PackageCheck, shipping: Truck, taxes: ReceiptText, notifications: Bell, files: FileStack, billing: CircleDollarSign, "custom-data": Database, apps: AppWindow } as const;

export function SettingsPanel() {
  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceType>("business_showcase");
  const [capabilities, setCapabilities] = useState<Capability[]>(["website", "services"]);
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(() => typeof window === "undefined" ? "business" : new URLSearchParams(window.location.search).get("category") || "business");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/workspace").then((response) => response.json()).then((data) => {
      setName(data.workspace?.name || ""); setType(data.workspace?.type || "business_showcase");
      setCategory(data.workspace?.businessCategory || ""); setCapabilities(data.workspace?.capabilities || ["website"]); setLoaded(true);
    });
  }, []);
  const categories = useMemo(() => settingsForWorkspace(type, capabilities), [type, capabilities]);
  const active = categories.find((item) => item.id === selected) || categories[0];

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setSaved(false);
    const response = await fetch("/api/workspace", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, businessCategory: category }) });
    setSaving(false); setSaved(response.ok);
  };
  const select = (id: string) => { setSelected(id); window.history.replaceState({}, "", `/settings?category=${encodeURIComponent(id)}`); };

  return <main className="admin-page admin-settings-page">
    <header className="admin-page-header"><div><p>Configuration</p><h1>Settings</h1><span>Manage your workspace from one organized place.</span></div></header>
    <div className="admin-settings-layout">
      <aside className="admin-settings-list" aria-label="Settings categories">{categories.map((item) => { const Icon = icons[item.icon as keyof typeof icons] || Boxes; return <button type="button" key={item.id} onClick={() => select(item.id)} className={active?.id === item.id ? "is-active" : ""}><span><Icon/></span><div><strong>{item.label}</strong><small>{item.description}</small></div><ChevronRight/></button>; })}</aside>
      <section className="admin-settings-content">{!loaded || !active ? <div className="admin-card admin-settings-loading">Loading settings…</div> : active.id === "business" ? <BusinessDetails name={name} setName={setName} type={type} category={category} setCategory={setCategory} saving={saving} saved={saved} submit={submit}/> : active.id === "users" ? <TeamManager/> : <SettingsCategoryPanel category={active} type={type} capabilities={capabilities}/>}</section>
    </div>
  </main>;
}

function BusinessDetails({ name, setName, type, category, setCategory, saving, saved, submit }: { name: string; setName: (value: string) => void; type: WorkspaceType; category: string; setCategory: (value: string) => void; saving: boolean; saved: boolean; submit: (event: FormEvent) => void }) {
  return <form onSubmit={submit}><section className="admin-card"><div className="admin-card-title"><span className="admin-icon"><Store/></span><div><h2>Business details</h2><p>Your workspace type stays stable while capabilities can expand later.</p></div></div><div className="admin-form-grid"><label><span>Workspace name</span><Input required value={name} onChange={(event) => setName(event.target.value)}/></label><label><span>Workspace type</span><Input readOnly value={workspacePresets[type].label} className="bg-black/[.025]"/></label>{workspacePresets[type].requiresBusinessCategory && <label><span>Business category</span><Input required value={category} onChange={(event) => setCategory(event.target.value)}/></label>}</div><div className="admin-card-footer">{saved && <span className="admin-saved"><Check/>Saved</span>}<Button disabled={saving} className="admin-primary">{saving ? "Saving…" : "Save changes"}</Button></div></section></form>;
}

function SettingsCategoryPanel({ category, type, capabilities }: { category: SettingsCategory; type: WorkspaceType; capabilities: Capability[] }) {
  const Icon = icons[category.icon as keyof typeof icons] || Cloud;
  const notes: Record<string, string> = {
    locations: "Locations will become the shared foundation for inventory and POS registers in the commerce phases.",
    domains: "Your workspace slug is active now. Custom-domain connection and verification remain managed through the domain service.",
    payments: "Payment providers will be connected through adapters so checkout and POS share transaction records.",
    checkout: "Checkout preferences will apply to the Online Store channel without changing your website content.",
    shipping: "Shipping, local delivery and pickup rules will be attached to commerce locations.",
    taxes: "Tax configuration will be centralized for online and in-person sales.",
    notifications: "Workspace and customer notification preferences will live here.",
    files: "Images and documents will use the shared asset service and Cloudflare R2.",
    billing: "Your plan, usage limits, invoices and payment history will appear here.",
    "custom-data": "Custom fields will extend core records without changing their parent schemas.",
    apps: "Installed apps and their granted permission scopes will appear here. No apps are installed yet.",
  };
  return <section className="admin-card admin-settings-detail"><div className="admin-card-title"><span className="admin-icon"><Icon/></span><div><h2>{category.label}</h2><p>{category.description}</p></div></div><div className="admin-settings-empty"><span><Icon/></span><h3>{category.label} is ready for configuration</h3><p>{notes[category.id] || "Configuration options will appear here as the corresponding service becomes available."}</p><div><small>Workspace</small><strong>{workspacePresets[type].label}</strong><small>Enabled capabilities</small><strong>{capabilities.join(", ")}</strong></div></div></section>;
}
