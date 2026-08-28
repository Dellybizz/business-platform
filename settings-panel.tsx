"use client";
import { FormEvent, useEffect, useState } from "react";
import { Bell, Check, CreditCard, Globe2, ReceiptText, Settings2, Store, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { workspacePresets, type WorkspaceType } from "@/src/core/workspaces/model";

export function SettingsPanel() {
  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceType>("business_showcase");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    fetch("/api/workspace").then((response) => response.json()).then((data) => {
      setName(data.workspace?.name || "");
      setType(data.workspace?.type || "business_showcase");
      setCategory(data.workspace?.businessCategory || "");
    });
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    const response = await fetch("/api/workspace", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, businessCategory: category }),
    });
    setSaving(false);
    setSaved(response.ok);
  };
  const settings = [[Globe2,"Domains","Manage domains and DNS"],[CreditCard,"Payments","Providers and methods"],[Truck,"Shipping","Zones and rates"],[ReceiptText,"Taxes","Tax rates and policies"],[Users,"Staff","Team members and permissions"],[Bell,"Notifications","Email and SMS preferences"],[Settings2,"Preferences","Business defaults"],[Store,"Plans & billing","Plan and billing history"]] as const;
  return <main className="admin-page"><header className="admin-page-header"><div><p>Configuration</p><h1>Settings</h1><span>Manage your business, website and platform preferences.</span></div></header><form onSubmit={submit} className="admin-settings-grid"><section className="admin-card"><div className="admin-card-title"><span className="admin-icon"><Store/></span><div><h2>Workspace details</h2><p>Your starting type stays stable while additional capabilities can be enabled later.</p></div></div><div className="admin-form-grid"><label><span>Workspace name</span><Input required value={name} onChange={(event) => setName(event.target.value)}/></label><label><span>Workspace type</span><Input readOnly value={workspacePresets[type].label} className="bg-black/[.025]"/></label>{workspacePresets[type].requiresBusinessCategory && <label><span>Business category</span><Input required value={category} onChange={(event) => setCategory(event.target.value)}/></label>}</div><div className="admin-card-footer">{saved && <span className="admin-saved"><Check/>Saved</span>}<Button disabled={saving} className="admin-primary">{saving ? "Saving…" : "Save changes"}</Button></div></section><section><h2 className="mb-3 text-sm font-semibold">Platform settings</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{settings.map(([Icon,title,description]) => <button type="button" key={title} className="admin-card flex min-h-24 items-start gap-3 p-4 text-left hover:bg-[#fafafa]"><span className="admin-icon shrink-0"><Icon/></span><span><strong className="block text-xs">{title}</strong><small className="mt-1 block text-[10px] leading-4 text-black/40">{description}</small><em className="mt-2 block text-[9px] not-italic text-black/30">Coming soon</em></span></button>)}</div></section></form></main>;
}
