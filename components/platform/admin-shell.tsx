"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Building2, FileText, Globe2, Home, Inbox, Layers3, Menu, Palette, Settings, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

const primary=[
 {href:"/dashboard",label:"Home",icon:Home},
 {href:"/content",label:"Content",icon:Boxes},
 {href:"/inbox",label:"Inbox",icon:Inbox},
 {href:"/builder",label:"Website",icon:Layers3},
 {href:"/pages",label:"Pages",icon:FileText},
 {href:"/themes",label:"Themes",icon:Palette},
];
const secondary=[{href:"/businesses",label:"Businesses",icon:Building2},{href:"/settings",label:"Settings",icon:Settings}];

export function AdminShell({children}:{children:ReactNode}){
 const path=usePathname(),[open,setOpen]=useState(false),[name,setName]=useState("Your business"),[slug,setSlug]=useState("");
 useEffect(()=>{fetch("/api/workspace").then(r=>r.json()).then(d=>{setName(d.workspace?.name||"Your business");setSlug(d.workspace?.slug||"")}).catch(()=>{})},[]);
 useEffect(()=>setOpen(false),[path]);
 const nav=(items:typeof primary)=><>{items.map(({href,label,icon:Icon})=>{const active=path===href;return <Link key={href} href={href} className={`admin-nav-item ${active?"is-active":""}`}><Icon className="size-[18px]"/><span>{label}</span></Link>})}</>;
 return <div className="admin-shell">
  <header className="admin-mobile-bar"><button onClick={()=>setOpen(true)} aria-label="Open navigation"><Menu/></button><Link href="/dashboard" className="admin-brand"><span>M</span>Modulo</Link>{slug?<Link href={`/s/${slug}`} aria-label="View website"><Globe2/></Link>:<span/>}</header>
  {open&&<button className="admin-scrim" onClick={()=>setOpen(false)} aria-label="Close navigation"/>}
  <aside className={`admin-sidebar ${open?"is-open":""}`}><div className="admin-sidebar-head"><Link href="/dashboard" className="admin-brand"><span>M</span>Modulo</Link><button className="lg:hidden" onClick={()=>setOpen(false)} aria-label="Close navigation"><X/></button></div><Link href="/businesses" className="admin-business"><span>{name.slice(0,1).toUpperCase()}</span><div><strong>{name}</strong><small>Manage business</small></div></Link><nav>{nav(primary)}</nav><div className="admin-nav-spacer"/><nav>{nav(secondary)}</nav>{slug&&<Link href={`/s/${slug}`} className="admin-view-site"><Globe2 className="size-4"/>View website</Link>}</aside>
  <div className="admin-canvas">{children}</div>
  <nav className="admin-bottom-nav">{primary.slice(0,5).map(({href,label,icon:Icon})=><Link key={href} href={href} className={path===href?"is-active":""}><Icon/><span>{label}</span></Link>)}</nav>
 </div>
}
