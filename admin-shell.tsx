"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Boxes,
  Building2,
  FileText,
  Globe2,
  Home,
  Inbox,
  Layers3,
  LogOut,
  Menu,
  Palette,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import type { Capability, WorkspaceType } from "@/src/core/workspaces/model";

const manage = [{ href: "/dashboard", label: "Home", icon: Home }];
const website = [
  { href: "/site", label: "Overview", icon: Globe2 },
  { href: "/builder", label: "Visual editor", icon: Layers3 },
  { href: "/pages", label: "Pages", icon: FileText },
  { href: "/themes", label: "Themes", icon: Palette },
];
const account = [
  { href: "/businesses", label: "Businesses", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Your business");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<WorkspaceType>("business_showcase");
  const [capabilities, setCapabilities] = useState<Capability[]>(["website", "services"]);

  useEffect(() => {
    fetch("/api/workspace")
      .then((response) => response.json())
      .then((data) => {
        setName(data.workspace?.name || "Your business");
        setSlug(data.workspace?.slug || "");
        setType(data.workspace?.type || "business_showcase");
        setCapabilities(data.workspace?.capabilities || ["website"]);
      })
      .catch(() => {});
  }, []);
  const business = capabilities.includes("catalog")
    ? [
        { href: "/content", label: "Products", icon: Boxes },
        { href: "/inbox", label: "Orders", icon: Inbox },
        { href: "/inbox", label: "Customers", icon: Users },
      ]
    : capabilities.includes("services")
      ? [
          { href: "/content", label: "Services", icon: Boxes },
          { href: "/inbox", label: capabilities.includes("bookings") ? "Bookings & enquiries" : "Enquiries", icon: Inbox },
          { href: "/inbox", label: "Contacts", icon: Users },
        ]
      : [
          { href: "/content", label: type === "cv" ? "Experience" : "Projects", icon: Boxes },
          { href: "/inbox", label: "Enquiries", icon: Inbox },
          { href: "/inbox", label: "Contacts", icon: Users },
        ];
  const nav = (items: { href: string; label: string; icon: typeof Home }[]) => (
    <>{items.map(({ href, label, icon: Icon }) => {
      const active = path === href && !(href === "/inbox" && label === "Customers");
      return <Link key={label} href={href} onClick={() => setOpen(false)} className={`admin-nav-item ${active ? "is-active" : ""}`}><Icon className="size-[16px]"/><span>{label}</span></Link>;
    })}</>
  );
  const mobileNavigation = [manage[0], website[0], business[0], business[1], account[1]];

  return <div className="admin-shell">
    <header className="admin-mobile-bar"><button onClick={() => setOpen(true)} aria-label="Open navigation"><Menu/></button><Link href="/dashboard" className="admin-brand"><LogoMark/>Modulo</Link>{slug ? <Link href={`/s/${slug}`} aria-label="View website"><Globe2/></Link> : <span/>}</header>
    {open && <button className="admin-scrim" onClick={() => setOpen(false)} aria-label="Close navigation"/>}
    <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
      <div className="admin-sidebar-head"><Link href="/dashboard" className="admin-brand"><LogoMark/>Modulo</Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X/></button></div>
      <Link href="/businesses" className="admin-business"><span>{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>Switch business</small></div></Link>
      <NavGroup label="Manage">{nav(manage)}</NavGroup>
      <NavGroup label="Website">{nav(website)}</NavGroup>
      <NavGroup label={capabilities.includes("catalog") ? "Commerce" : type === "cv" ? "CV" : type === "portfolio" ? "Portfolio" : "Business"}>{nav(business)}</NavGroup>
      <div className="admin-nav-spacer"/>
      <nav>{nav(account)}</nav>
      {slug && <Link href={`/s/${slug}`} className="admin-view-site"><Globe2 className="size-4"/>View website</Link>}
    </aside>
    <div className="admin-canvas">
      <header className="admin-topbar">
        <label><Search/><input placeholder="Search or jump to…"/><kbd>⌘ K</kbd></label>
        <div><Link href="/content" className="admin-create"><Plus/>Create</Link><Link href="/inbox" aria-label="Notifications"><Bell/></Link><Link href="/businesses" className="admin-avatar">{name.slice(0, 2).toUpperCase()}</Link><Link href="/api/auth/logout" aria-label="Sign out"><LogOut/></Link></div>
      </header>
      {children}
    </div>
    <nav className="admin-bottom-nav">{mobileNavigation.map(({ href, label, icon: Icon }) => <Link key={label} href={href} className={path === href ? "is-active" : ""}><Icon/><span>{label}</span></Link>)}</nav>
  </div>;
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return <div className="admin-nav-group"><p>{label}</p><nav>{children}</nav></div>;
}

function LogoMark() {
  return <span className="admin-logo-mark"><i/><i/><i/><i/></span>;
}
