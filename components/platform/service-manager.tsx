"use client";

import { useEffect, useState } from "react";
import { Check, CirclePause, ExternalLink, MonitorSmartphone, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { EntitlementStatus, ServiceEntitlement, ServiceProduct, ServiceProductDefinition } from "@/src/core/entitlements/model";

type CatalogItem = ServiceProductDefinition & { service: ServiceProduct };

export function ServiceManager() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [entitlements, setEntitlements] = useState<ServiceEntitlement[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/services").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Services could not be loaded");
      setCatalog(data.catalog || []); setEntitlements(data.entitlements || []);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Services could not be loaded"));
  }, []);

  const update = async (service: ServiceProduct, status: EntitlementStatus) => {
    setBusy(service); setError("");
    const response = await fetch("/api/services", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ service, status }) });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setError(data.error || "Service could not be updated");
    setEntitlements(data.entitlements || []);
    window.location.reload();
  };

  return <section className="admin-card admin-settings-detail"><div className="admin-card-title"><span className="admin-icon"><Store/></span><div><h2>Services</h2><p>Website and POS are independent. Activate only the services this workspace needs.</p></div></div>{error && <p role="alert" className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="grid gap-4 p-6 md:grid-cols-2">{catalog.map((item) => { const entitlement = entitlements.find((entry) => entry.service === item.service); const active = entitlement?.status === "active" || entitlement?.status === "trial"; const Icon = item.service === "pos" ? MonitorSmartphone : Store; return <article key={item.service} className={`rounded-xl border p-5 ${active ? "border-[#315b3d] bg-[#f5faf6]" : "border-black/10 bg-white"}`}><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e7efe9] text-[#294b34]"><Icon className="size-5"/></span><div><h3 className="font-semibold">{item.label}</h3><p className="mt-1 text-xs leading-5 text-black/50">{item.description}</p></div></div><div className="mt-4 flex items-center justify-between"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-emerald-100 text-emerald-800" : "bg-black/5 text-black/50"}`}>{active ? <Check className="size-3"/> : <CirclePause className="size-3"/>}{entitlement?.status || "Not activated"}</span>{active ? <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={item.dashboardHref}>Open <ExternalLink className="size-3"/></Link></Button><Button size="sm" variant="outline" disabled={busy === item.service} onClick={() => update(item.service, "suspended")}>Suspend</Button></div> : <Button size="sm" className="bg-[#294b34]" disabled={busy === item.service} onClick={() => update(item.service, "active")}>{busy === item.service ? "Activating…" : "Activate"}</Button>}</div></article>; })}</div></section>;
}
