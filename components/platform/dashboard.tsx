"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  Check,
  ChevronRight,
  FilePlus2,
  Globe2,
  Inbox,
  Layers3,
  MoreHorizontal,
  PackagePlus,
  Palette,
  Plus,
  Settings2,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";
import { hasUsableService, serviceCatalog, type ServiceEntitlement } from "@/src/core/entitlements/model";

type Summary = { items: number; requests: number; customers: number; unread: number };
type Item = { id: string; title: string; price: number; status: string; kind: string };

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function Dashboard() {
  const [type, setType] = useState<WorkspaceType>("business_showcase");
  const [capabilities, setCapabilities] = useState<Capability[]>(["website", "services"]);
  const [services, setServices] = useState<ServiceEntitlement[]>([]);
  const [name, setName] = useState("Your business");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [summary, setSummary] = useState<Summary>({ items: 0, requests: 0, customers: 0, unread: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/workspace").then((response) => response.json()),
      fetch("/api/items").then((response) => response.json()),
    ])
      .then(([workspaceData, itemData]) => {
        if (workspaceData.workspace) {
          setType(workspaceData.workspace.type);
          setCapabilities(workspaceData.workspace.capabilities || []);
          setServices(workspaceData.workspace.services || []);
          setName(workspaceData.workspace.name);
          setSlug(workspaceData.workspace.slug || "");
        }
        if (workspaceData.page) setStatus(workspaceData.page.status);
        if (workspaceData.summary) setSummary(workspaceData.summary);
        if (Array.isArray(itemData.items)) setItems(itemData.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const contentLabel = capabilities.includes("catalog") ? "Products" : capabilities.includes("services") ? "Services" : type === "cv" ? "Experience" : "Projects";
  const requestLabel = capabilities.includes("checkout") ? "Orders" : capabilities.includes("bookings") ? "Bookings" : "Enquiries";
  const totalValue = useMemo(() => items.reduce((total, item) => total + Number(item.price || 0), 0), [items]);
  const isCommerce = capabilities.includes("catalog");
  const websiteService = (["ecommerce_website", "business_showcase", "cv", "portfolio"] as const).find((service) => hasUsableService(services, service));
  const hasWebsite = Boolean(websiteService);
  const hasPos = hasUsableService(services, "pos");
  const combinedCommerce = hasUsableService(services, "ecommerce_website") && hasPos;
  const setup = hasWebsite ? [
    { label: "Add your business details", done: name !== "Your business", href: "/settings" },
    { label: "Choose a theme", done: false, href: "/themes" },
    { label: `Add your first ${contentLabel.toLowerCase().slice(0, -1)}`, done: summary.items > 0, href: "/content" },
    { label: "Publish your website", done: status === "published", href: "/builder" },
  ] : [
    { label: "Add your business details", done: name !== "Your business", href: "/settings" },
    { label: `Add your first ${contentLabel.toLowerCase().replace(/s$/, "")}`, done: summary.items > 0, href: "/content" },
    { label: "Open Point of Sale", done: false, href: "/pos" },
    { label: "Invite POS staff", done: false, href: "/settings?category=users" },
  ];
  const completed = setup.filter((item) => item.done).length;
  const progress = completed * 25;

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#1d211d]">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-black/10 bg-white/95 px-5 backdrop-blur lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-black/40">Business home</p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-[-.02em]">{name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {slug && hasWebsite && (
            <Button asChild variant="outline" size="sm" className="hidden rounded-lg sm:flex">
              <Link href={`/s/${slug}`}><Globe2 className="size-4" />View site</Link>
            </Button>
          )}
          <Button asChild size="sm" className="rounded-lg bg-[#294b34] hover:bg-[#1f3b29]">
            <Link href="/content"><Plus className="size-4" />Create</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] p-4 sm:p-6 lg:p-8">
        <ServiceOverview services={services} combined={combinedCommerce}/>
        <div className="mt-4 grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)]">
          <SetupCard completed={completed} progress={progress} setup={setup} />

          <section className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label={isCommerce ? "Catalog value" : contentLabel} value={loading ? "—" : isCommerce ? money.format(totalValue) : String(summary.items)} detail={summary.items ? `${summary.items} published or draft entries` : `Add your first ${contentLabel.toLowerCase().replace(/s$/, "")}`} />
              <Metric label={requestLabel} value={loading ? "—" : String(summary.requests)} detail={`${summary.unread} awaiting review`} />
              <Metric label="Customers" value={loading ? "—" : String(summary.customers)} detail="Unique contacts" />
              <Metric label={hasWebsite ? "Website" : "POS"} value={loading ? "—" : hasWebsite ? status : "Active"} detail={hasWebsite ? slug ? "Domain ready" : "Finish setup" : "Ready for in-person sales"} capitalize />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_245px]">
              <div id="analytics"><OverviewChart summary={summary} label={requestLabel} /></div>
              <QuickActions contentLabel={contentLabel} />
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.25fr)_245px]">
          <RecentActivity summary={summary} status={status} contentLabel={contentLabel} requestLabel={requestLabel} />
          <TopContent items={items} contentLabel={contentLabel} loading={loading} />
          <StoreStatus status={hasWebsite ? status : "active"} slug={hasWebsite ? slug : "pos"} itemCount={summary.items} title={combinedCommerce ? "Commerce status" : hasPos && !hasWebsite ? "POS status" : isCommerce ? "Store status" : "Site status"} />
        </div>
      </div>
    </main>
  );
}

function ServiceOverview({ services, combined }: { services: ServiceEntitlement[]; combined: boolean }) {
  const active = services.filter((item) => item.status === "active" || item.status === "trial");
  return <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-black/40">{combined ? "Combined business overview" : "Active service"}</p><h2 className="mt-1 text-base font-semibold">{combined ? "Website and POS share one commerce core" : active[0] ? serviceCatalog[active[0].service].label : "Choose a service"}</h2><p className="mt-1 text-xs text-black/45">{combined ? "Products, inventory, customers and orders stay synchronized across both channels." : "Only explicitly activated services appear in navigation and billing."}</p></div><div className="flex flex-wrap gap-2">{active.map((item) => <Button key={item.service} asChild size="sm" variant="outline"><Link href={serviceCatalog[item.service].dashboardHref}>{serviceCatalog[item.service].label}<ChevronRight className="size-3"/></Link></Button>)}<Button asChild size="sm" variant="outline"><Link href="/settings?category=services">Manage services</Link></Button></div></Card>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)] ${className}`}>{children}</div>;
}

function SetupCard({ completed, progress, setup }: { completed: number; progress: number; setup: { label: string; done: boolean; href: string }[] }) {
  return (
    <Card className="p-5 xl:row-span-2">
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Setup checklist</h2><Sparkles className="size-4 text-[#52735c]" /></div>
      <p className="mt-1 text-xs text-black/45">{completed} / 4 completed</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/8"><div className="h-full rounded-full bg-[#315b3d] transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="mt-5 space-y-1">
        {setup.map((item) => (
          <Link key={item.label} href={item.href} className="group flex items-center gap-2.5 rounded-lg px-1 py-2 text-xs hover:bg-black/[.025]">
            <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${item.done ? "border-[#315b3d] bg-[#315b3d] text-white" : "border-black/25"}`}>{item.done && <Check className="size-2.5" />}</span>
            <span className={item.done ? "text-black/45 line-through" : "text-black/70"}>{item.label}</span>
            <ChevronRight className="ml-auto size-3.5 text-black/20 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
      <Link href="/settings" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#315b3d] hover:underline">View all tasks <ArrowUpRight className="size-3" /></Link>
    </Card>
  );
}

function Metric({ label, value, detail, capitalize = false }: { label: string; value: string; detail: string; capitalize?: boolean }) {
  return <Card className="p-4"><p className="text-xs text-black/45">{label}</p><p className={`mt-3 truncate text-2xl font-semibold tracking-[-.035em] ${capitalize ? "capitalize" : ""}`}>{value}</p><p className="mt-1 text-[11px] text-[#497556]">{detail}</p></Card>;
}

function OverviewChart({ summary, label }: { summary: Summary; label: string }) {
  const hasActivity = summary.requests > 0;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/8 px-5 py-4"><div><h2 className="text-sm font-semibold">Business overview</h2><p className="mt-0.5 text-[11px] text-black/40">Customer activity across your website</p></div><button className="rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] text-black/55">Last 30 days</button></div>
      <div className="relative h-[210px] px-5 pb-5 pt-4">
        <div className="absolute inset-x-5 bottom-8 top-5 flex flex-col justify-between">{[0, 1, 2, 3].map((line) => <span key={line} className="border-t border-dashed border-black/8" />)}</div>
        <svg viewBox="0 0 700 180" preserveAspectRatio="none" className="relative h-full w-full" aria-label={`${label} activity chart`}>
          <path d={hasActivity ? "M0 145 C60 142 80 118 140 124 S220 90 280 105 S360 65 420 82 S510 48 560 60 S640 24 700 34" : "M0 145 C90 143 135 140 210 142 S350 139 430 141 S600 136 700 138"} fill="none" stroke="#315b3d" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <path d="M0 157 C100 150 165 158 240 151 S380 154 470 148 S610 151 700 143" fill="none" stroke="#b7bdb8" strokeDasharray="5 6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        {!hasActivity && <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="rounded-full border border-black/8 bg-white/90 px-3 py-1.5 text-xs text-black/45 shadow-sm">Activity will appear after your first {label.toLowerCase().slice(0, -1)}</span></div>}
      </div>
    </Card>
  );
}

function QuickActions({ contentLabel }: { contentLabel: string }) {
  const actions = [
    { label: "Create page", href: "/pages", icon: FilePlus2 },
    { label: `Add ${contentLabel.toLowerCase().replace(/s$/, "")}`, href: "/content", icon: PackagePlus },
    { label: "Edit website", href: "/builder", icon: Layers3 },
    { label: "Choose theme", href: "/themes", icon: Palette },
    { label: "Review inbox", href: "/inbox", icon: Inbox },
    { label: "Business settings", href: "/settings", icon: Settings2 },
  ];
  return <Card className="p-4"><h2 className="px-1 text-sm font-semibold">Quick actions</h2><div className="mt-3 space-y-1">{actions.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-black/65 hover:bg-[#f3f4f1] hover:text-black"><Icon className="size-3.5" />{label}<ChevronRight className="ml-auto size-3 text-black/20" /></Link>)}</div></Card>;
}

function RecentActivity({ summary, status, contentLabel, requestLabel }: { summary: Summary; status: string; contentLabel: string; requestLabel: string }) {
  const rows = [
    { text: `${summary.items} ${contentLabel.toLowerCase()} available`, icon: Boxes, tone: "bg-blue-50 text-blue-700" },
    { text: `${summary.unread} unread ${requestLabel.toLowerCase()}`, icon: Inbox, tone: "bg-amber-50 text-amber-700" },
    { text: `Website is ${status}`, icon: Globe2, tone: "bg-emerald-50 text-emerald-700" },
  ];
  return <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recent activity</h2><MoreHorizontal className="size-4 text-black/30" /></div><div className="mt-4 space-y-3">{rows.map(({ text, icon: Icon, tone }) => <div key={text} className="flex items-center gap-3"><span className={`grid size-7 place-items-center rounded-lg ${tone}`}><Icon className="size-3.5" /></span><p className="min-w-0 flex-1 truncate text-xs text-black/65">{text}</p><span className="text-[10px] text-black/30">Now</span></div>)}</div><Link href="/inbox" className="mt-5 inline-block text-xs font-medium text-[#315b3d] hover:underline">View all activity</Link></Card>;
}

function TopContent({ items, contentLabel, loading }: { items: Item[]; contentLabel: string; loading: boolean }) {
  return <Card className="overflow-hidden"><div className="flex items-center justify-between px-5 py-4"><h2 className="text-sm font-semibold">Top {contentLabel.toLowerCase()}</h2><Link href="/content" className="text-[11px] font-medium text-[#315b3d] hover:underline">View all</Link></div>{loading ? <div className="p-5 text-xs text-black/40">Loading content…</div> : items.length ? <div className="divide-y divide-black/8">{items.slice(0, 4).map((item, index) => <Link href="/content" key={item.id} className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-2.5 hover:bg-black/[.015]"><span className="grid size-7 place-items-center rounded-md bg-[#f0f1ed] text-[10px] font-semibold text-black/45">{index + 1}</span><div className="min-w-0"><p className="truncate text-xs font-medium">{item.title}</p><p className="mt-0.5 text-[10px] capitalize text-black/35">{item.status}</p></div><span className="text-xs font-medium">{item.price ? money.format(item.price) : "—"}</span></Link>)}</div> : <div className="grid min-h-36 place-items-center px-5 text-center"><div><Boxes className="mx-auto size-5 text-black/25" /><p className="mt-2 text-xs font-medium">No {contentLabel.toLowerCase()} yet</p><Link href="/content" className="mt-1 inline-block text-[11px] text-[#315b3d] hover:underline">Add your first one</Link></div></div>}</Card>;
}

function StoreStatus({ status, slug, itemCount, title }: { status: string; slug: string; itemCount: number; title: string }) {
  const rows = [
    ["Website", status === "published" ? "Live" : "Draft", status === "published"],
    ["Content", itemCount ? "Ready" : "Empty", itemCount > 0],
    ["Domain", slug ? "Connected" : "Pending", Boolean(slug)],
  ] as const;
  return <Card className="p-5"><div className="flex items-center gap-2"><Store className="size-4 text-black/40" /><h2 className="text-sm font-semibold">{title}</h2></div><div className="mt-4 space-y-3">{rows.map(([label, value, good]) => <div key={label} className="flex items-center justify-between text-xs"><span className="text-black/45">{label}</span><span className="flex items-center gap-1.5 font-medium"><span className={`size-1.5 rounded-full ${good ? "bg-emerald-600" : "bg-amber-500"}`} />{value}</span></div>)}</div><Link href="/settings" className="mt-5 flex items-center justify-between rounded-lg bg-[#f3f4f1] px-3 py-2 text-xs font-medium">View setup <ChevronRight className="size-3.5" /></Link></Card>;
}
