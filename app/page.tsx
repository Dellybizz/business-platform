"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileUser,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeWorkspaceSlug } from "@/src/core/workspaces/onboarding";
import { workspacePresets, type WorkspaceType } from "@/src/core/workspaces/model";
import { serviceCatalog, type ServiceProduct } from "@/src/core/entitlements/model";

const choices = [
  { id: "commerce_business", icon: ShoppingBag, tone: "bg-amber-100 text-amber-900" },
  { id: "business_showcase", icon: Store, tone: "bg-blue-100 text-blue-900" },
  { id: "cv", icon: FileUser, tone: "bg-rose-100 text-rose-900" },
  { id: "portfolio", icon: BriefcaseBusiness, tone: "bg-violet-100 text-violet-900" },
] as const;

export default function Home() {
  const [selected, setSelected] = useState<WorkspaceType>("commerce_business");
  const [selectedServices, setSelectedServices] = useState<ServiceProduct[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const preset = workspacePresets[selected];
  const suggestedSlug = useMemo(() => normalizeWorkspaceSlug(name), [name]);
  const displayedSlug = slugEdited ? slug : suggestedSlug;

  const createWorkspace = async () => {
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          slug: displayedSlug,
          type: selected,
          businessCategory: preset.requiresBusinessCategory ? category : undefined,
          services: selected === "commerce_business" ? selectedServices : undefined,
          requestId: requestId.current,
        }),
      });
      const data = await response.json() as { error?: string; dashboardUrl?: string };
      if (response.status === 401) {
        window.location.assign(`/login?returnTo=${encodeURIComponent("/")}`);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Workspace could not be created");
      window.location.assign(data.dashboardUrl || "/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace could not be created");
      setCreating(false);
    }
  };

  const canSubmit = name.trim().length > 0
    && displayedSlug.length >= 3
    && (selected !== "commerce_business" || selectedServices.length > 0)
    && (!preset.requiresBusinessCategory || category.trim().length > 0);

  return <main className="min-h-screen bg-[#f6f5f1] text-[#191a17]">
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
      <div className="flex items-center gap-3 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#18392b] text-white">M</span> Modulo</div>
      <Link href="/dashboard" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 hover:border-black/25">Open dashboard</Link>
    </nav>
    <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-8 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:pt-14">
      <div className="max-w-xl lg:sticky lg:top-12 lg:self-start">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#dff2e5] px-3 py-1.5 text-sm font-medium text-[#18392b]"><Sparkles className="size-4"/> One platform, four starting points</span>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">Start with exactly what you need.</h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-black/55">Online store and POS share one business. Showcase, CV and portfolio sites stay focused—and every workspace can gain more capabilities later.</p>
        <div className="mt-8 space-y-3 text-sm text-black/65">{["Appropriate pages and modules from the first click", "Secure account and workspace separation", "Add capabilities later without rebuilding your site"].map((item) => <div className="flex items-center gap-3" key={item}><span className="grid size-6 place-items-center rounded-full bg-[#18392b] text-white"><Check className="size-3.5"/></span>{item}</div>)}</div>
      </div>
      <div className="rounded-[2rem] border border-black/8 bg-white p-5 shadow-[0_25px_70px_rgba(38,43,34,.12)] sm:p-8">
        <p className="text-sm font-medium text-black/45">CREATE YOUR WORKSPACE</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">What are you building?</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">{choices.map(({ id, icon: Icon, tone }) => {
          const choice = workspacePresets[id];
          return <button type="button" key={id} onClick={() => { setSelected(id); setSelectedServices([]); }} className={`flex min-h-32 flex-col items-start rounded-2xl border p-4 text-left transition ${selected === id ? "border-[#18392b] bg-[#f1f7f3] ring-1 ring-[#18392b]" : "border-black/8 hover:border-black/20"}`}>
            <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5"/></span>
            <strong className="mt-3 block text-sm">{choice.label}</strong>
            <span className="mt-1 block text-xs leading-5 text-black/50">{choice.description}</span>
          </button>;
        })}</div>
        {selected === "commerce_business" && <div className="mt-6"><p className="text-xs font-semibold">Choose the services to activate</p><p className="mt-1 text-xs text-black/45">Select Website, POS, or both. Nothing is activated automatically.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{(["ecommerce_website", "pos"] as const).map((service) => { const definition = serviceCatalog[service]; const active = selectedServices.includes(service); return <button type="button" key={service} aria-pressed={active} onClick={() => setSelectedServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service])} className={`rounded-xl border p-4 text-left transition ${active ? "border-[#18392b] bg-[#f1f7f3] ring-1 ring-[#18392b]" : "border-black/10 hover:border-black/25"}`}><span className="flex items-center justify-between text-sm font-semibold">{definition.label}<span className={`grid size-5 place-items-center rounded-full border ${active ? "border-[#18392b] bg-[#18392b] text-white" : "border-black/20"}`}>{active && <Check className="size-3"/>}</span></span><span className="mt-1.5 block text-xs leading-5 text-black/50">{definition.description}</span></button>; })}</div></div>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">Workspace or site name<Input required value={name} onChange={(event) => setName(event.target.value)} placeholder={selected === "cv" ? "Your name" : "Your business name"} className="mt-1.5"/></label>
          <label className="text-xs font-semibold">Preferred slug<Input required value={displayedSlug} onChange={(event) => { setSlugEdited(true); setSlug(normalizeWorkspaceSlug(event.target.value)); }} placeholder="your-site" className="mt-1.5"/><span className="mt-1 block font-normal text-black/40">business.zanisheluxe.in/s/{displayedSlug || "your-site"}</span></label>
          {preset.requiresBusinessCategory && <label className="text-xs font-semibold sm:col-span-2">Business category<Input required value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Jewellery, salon, architecture" className="mt-1.5"/></label>}
        </div>
        <div className="mt-5 rounded-xl bg-[#f5f6f3] p-4"><p className="text-xs font-semibold">{selected === "commerce_business" ? "Selected services" : "Included from day one"}</p><div className="mt-2 flex flex-wrap gap-2">{(selected === "commerce_business" ? selectedServices.map((service) => serviceCatalog[service].label) : preset.capabilities.map((capability) => capability.replace("_", " "))).map((item) => <span key={item} className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] capitalize text-black/60">{item}</span>)}{selected === "commerce_business" && !selectedServices.length && <span className="text-[11px] text-black/45">Choose at least one service.</span>}</div></div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <Button onClick={createWorkspace} disabled={creating || !canSubmit} className="mt-6 h-12 w-full rounded-xl bg-[#18392b] text-base hover:bg-[#10291f]">{creating ? "Creating workspace…" : "Create my workspace"} {!creating && <ArrowRight className="ml-2 size-4"/>}</Button>
      </div>
    </section>
  </main>;
}
