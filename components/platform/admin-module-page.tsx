"use client";
import Link from "next/link";
import { BarChart3, Boxes, ChevronRight, ContactRound, Globe2, Inbox, MonitorSmartphone, Puzzle, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { loadWorkspace } from "@/lib/client/workspace";
import { PhaseDeliveryBadge } from "@/components/platform/phase-delivery-badge";

type ModuleId = "analytics" | "contacts" | "online-store" | "pos" | "apps";
type WorkspaceData = { workspace?: { name: string; slug: string; capabilities: string[] }; summary?: { items: number; requests: number; customers: number; unread: number }; page?: { status: string } };

const definitions = {
  analytics: { eyebrow: "Insights", title: "Analytics", description: "A live overview of content and customer activity.", icon: BarChart3 },
  contacts: { eyebrow: "Audience", title: "Customers and contacts", description: "People who have contacted or purchased from your workspace.", icon: ContactRound },
  "online-store": { eyebrow: "Sales channel", title: "Online Store", description: "Manage the website channel connected to your shared business data.", icon: Store },
  pos: { eyebrow: "Sales channel", title: "Point of Sale", description: "Prepare in-person selling over your shared catalog and customers.", icon: MonitorSmartphone },
  apps: { eyebrow: "Extensions", title: "Apps", description: "Extend the platform through permission-scoped plugins.", icon: Puzzle },
} as const;

export function AdminModulePage({ module }: { module: ModuleId }) {
  const definition = definitions[module];
  const [data, setData] = useState<WorkspaceData>({});
  const [submissions, setSubmissions] = useState<{ id: string; customerName: string; email: string; status: string; type: string }[]>([]);
  useEffect(() => {
    loadWorkspace().then((value) => setData(value as WorkspaceData));
    if (module === "contacts") fetch("/api/submissions").then((response) => response.json()).then((value) => setSubmissions(value.submissions || []));
  }, [module]);
  const summary = data.summary || { items: 0, requests: 0, customers: 0, unread: 0 };
  return <main className="admin-page"><header className="admin-page-header"><div><p>{definition.eyebrow}</p><h1>{definition.title}</h1><span>{definition.description}</span></div></header>
    {module === "analytics" && <div className="admin-module-metrics"><Metric label="Content items" value={summary.items}/><Metric label="Requests" value={summary.requests}/><Metric label="Unique contacts" value={summary.customers}/><Metric label="Needs review" value={summary.unread}/></div>}
    {module === "contacts" && <section className="admin-card"><div className="admin-card-title"><span className="admin-icon"><ContactRound/></span><div><h2>Recent contacts</h2><p>Built from real enquiries and customer activity.</p></div></div>{submissions.length ? <div className="admin-contact-list">{submissions.map((item) => <div key={item.id}><span>{item.customerName.slice(0, 1).toUpperCase()}</span><div><strong>{item.customerName}</strong><small>{item.email}</small></div><em>{item.status}</em></div>)}</div> : <Empty icon={ContactRound} title="No contacts yet" text="Contacts will appear after someone submits an enquiry or places an order." href="/site" action="View website"/>}</section>}
    {module === "online-store" && <section className="admin-card admin-channel-card"><div><span className="admin-icon"><Globe2/></span><div><h2>{data.workspace?.name || "Your online store"}</h2><p>Your website and commerce channel use the same workspace.</p></div></div><div className="admin-channel-status"><span>Website <b>{data.page?.status || "draft"}</b></span><span>Catalog <b>{summary.items ? `${summary.items} items` : "Empty"}</b></span><span>Domain <b>{data.workspace?.slug ? "Ready" : "Pending"}</b></span></div><Link href="/site">Manage channel <ChevronRight/></Link></section>}
    {module === "pos" && <section className="admin-card"><div className="admin-card-title"><span className="admin-icon"><MonitorSmartphone/></span><div><div className="flex flex-wrap items-center gap-2"><h2>Point of Sale foundation</h2><PhaseDeliveryBadge phase={15} label="POS selling workflow"/></div><p>POS is enabled as a sales channel for this workspace.</p></div></div><div className="admin-module-callout"><Boxes/><div><strong>{summary.items} shared catalog items</strong><p>Locations, registers and order creation arrive in the dedicated commerce and POS phases. This channel will use the same products, customers and orders as Online Store.</p></div></div></section>}
    {module === "apps" && <section className="admin-card"><div className="admin-card-title"><span className="admin-icon"><Puzzle/></span><div><div className="flex flex-wrap items-center gap-2"><h2>Installed apps</h2><PhaseDeliveryBadge phase={16} label="Plugin installation"/></div><p>Plugins add navigation through registrations—not edits to the admin shell.</p></div></div><Empty icon={Puzzle} title="No apps installed" text="Installed app navigation and granted scopes will appear here automatically." href="/settings?category=apps" action="App settings"/></section>}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="admin-card"><small>{label}</small><strong>{value}</strong><span>Live workspace data</span></div>; }
function Empty({ icon: Icon, title, text, href, action }: { icon: typeof Inbox; title: string; text: string; href: string; action: string }) { return <div className="admin-module-empty"><span><Icon/></span><h3>{title}</h3><p>{text}</p><Link href={href}>{action}</Link></div>; }
