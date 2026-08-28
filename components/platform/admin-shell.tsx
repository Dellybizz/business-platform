"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bell, Boxes, Building2, ChevronDown, FileText, Globe2, Home, Inbox, Layers3, LogOut, Menu, MonitorSmartphone, PackageSearch, Palette, Plus, Puzzle, Search, Settings, ShoppingBag, Users, X } from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { buildAdminNavigation, flattenAdminNavigation, type AdminNavigationItem } from "@/src/apps/merchant-admin/navigation";
import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";
import type { ServiceEntitlement } from "@/src/core/entitlements/model";

type Workspace = { id: string; name: string; type: WorkspaceType; role: string };
const iconMap = { home: Home, inbox: Inbox, content: Boxes, contacts: Users, analytics: BarChart3, website: Globe2, editor: Layers3, pages: FileText, themes: Palette, store: ShoppingBag, pos: MonitorSmartphone, apps: Puzzle, settings: Settings, plugin: Puzzle } as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [switching, setSwitching] = useState("");
  const [name, setName] = useState("Your workspace");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<WorkspaceType>("business_showcase");
  const [capabilities, setCapabilities] = useState<Capability[]>(["website", "services"]);
  const [services, setServices] = useState<ServiceEntitlement[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/workspace").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      setName(data.workspace?.name || "Your workspace"); setSlug(data.workspace?.slug || "");
      setType(data.workspace?.type || "business_showcase"); setCapabilities(data.workspace?.capabilities || ["website"]);
      setServices(data.workspace?.services || []);
      setWorkspaces(data.workspaces || []); setActiveWorkspaceId(data.workspace?.id || "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((value) => !value); }
      if (event.key === "Escape") { setPaletteOpen(false); setWorkspaceOpen(false); setMobileOpen(false); }
    };
    const pointer = (event: MouseEvent) => { if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) setWorkspaceOpen(false); };
    document.addEventListener("keydown", keydown); document.addEventListener("mousedown", pointer);
    return () => { document.removeEventListener("keydown", keydown); document.removeEventListener("mousedown", pointer); };
  }, []);

  const groups = useMemo(() => buildAdminNavigation({ type, capabilities, services }), [type, capabilities, services]);
  const allItems = useMemo(() => flattenAdminNavigation(groups), [groups]);
  const mobileItems = allItems.filter((item) => item.mobile).slice(0, 5);
  const results = allItems.filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(query.toLowerCase().trim()));

  const chooseWorkspace = async (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) { setWorkspaceOpen(false); return; }
    setSwitching(workspaceId);
    const response = await fetch("/api/workspace", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId }) });
    if (response.ok) window.location.assign("/dashboard"); else setSwitching("");
  };
  const openItem = (item: AdminNavigationItem) => { setPaletteOpen(false); setQuery(""); setMobileOpen(false); router.push(item.href); };

  return <div className="admin-shell">
    <header className="admin-mobile-bar"><button onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu/></button><Link href="/dashboard" className="admin-brand"><LogoMark/>Modulo</Link><button onClick={() => setPaletteOpen(true)} aria-label="Search"><Search/></button></header>
    {mobileOpen && <button className="admin-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="admin-sidebar-head"><Link href="/dashboard" className="admin-brand"><LogoMark/>Modulo</Link><button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X/></button></div>
      <div className="admin-workspace-switcher" ref={switcherRef}>
        <button className="admin-business" onClick={() => setWorkspaceOpen((value) => !value)} aria-expanded={workspaceOpen}><span>{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}</small></div><ChevronDown/></button>
        {workspaceOpen && <div className="admin-workspace-menu"><p>Switch workspace</p>{workspaces.map((workspace) => <button key={workspace.id} onClick={() => chooseWorkspace(workspace.id)} className={workspace.id === activeWorkspaceId ? "is-active" : ""} disabled={Boolean(switching)}><span>{workspace.name.slice(0, 1).toUpperCase()}</span><div><strong>{workspace.name}</strong><small>{workspace.role.replaceAll("_", " ")}</small></div>{switching === workspace.id ? <i/> : workspace.id === activeWorkspaceId ? <b>Current</b> : null}</button>)}<Link href="/"><Plus/>Create workspace</Link><Link href="/businesses"><Building2/>Manage workspaces</Link></div>}
      </div>
      <div className="admin-navigation">{groups.map((group) => <NavGroup key={group.id} label={group.label} className={group.id === "system" ? "admin-system-nav" : ""}>{group.items.map((item) => <NavLink key={item.id} item={item} active={path === item.href} onNavigate={() => setMobileOpen(false)}/>)}</NavGroup>)}</div>
      {slug && <Link href={`/s/${slug}`} className="admin-view-site"><Globe2 className="size-4"/>View website</Link>}
    </aside>
    <div className="admin-canvas"><header className="admin-topbar"><button className="admin-global-search" onClick={() => setPaletteOpen(true)}><Search/><span>Search or jump to…</span><kbd>⌘ K</kbd></button><div><Link href="/content" className="admin-create"><Plus/>Create</Link><Link href="/inbox" aria-label="Notifications"><Bell/></Link><span className="admin-avatar">{name.slice(0, 2).toUpperCase()}</span><Link href="/api/auth/logout" aria-label="Sign out"><LogOut/></Link></div></header>{children}</div>
    <nav className="admin-bottom-nav">{mobileItems.map((item) => { const Icon = iconMap[item.icon as keyof typeof iconMap] || Puzzle; return <Link key={item.id} href={item.href} className={path === item.href ? "is-active" : ""}><Icon/><span>{item.label}</span></Link>; })}</nav>
    {paletteOpen && <div className="admin-command-layer" role="dialog" aria-modal="true" aria-label="Search and command palette" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}><div className="admin-command"><label><Search/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…"/><kbd>Esc</kbd></label><div className="admin-command-results">{results.length ? results.map((item) => { const Icon = iconMap[item.icon as keyof typeof iconMap] || Puzzle; return <button key={item.id} onClick={() => openItem(item)}><span><Icon/></span><div><strong>{item.label}</strong><small>{item.href}</small></div><em>Open</em></button>; }) : <div className="admin-command-empty"><PackageSearch/><p>No results for “{query}”</p><small>Try products, website, settings or analytics.</small></div>}</div></div></div>}
  </div>;
}

function NavLink({ item, active, onNavigate }: { item: AdminNavigationItem; active: boolean; onNavigate: () => void }) { const Icon = iconMap[item.icon as keyof typeof iconMap] || Puzzle; return <Link href={item.href} onClick={onNavigate} className={`admin-nav-item ${active ? "is-active" : ""}`}><Icon/><span>{item.label}</span></Link>; }
function NavGroup({ label, children, className = "" }: { label?: string; children: ReactNode; className?: string }) { return <div className={`admin-nav-group ${className}`}>{label && <p>{label}</p>}<nav>{children}</nav></div>; }
function LogoMark() { return <span className="admin-logo-mark"><i/><i/><i/><i/></span>; }
