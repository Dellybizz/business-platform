"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Check, FileUser, Plus, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workspacePresets, type WorkspaceType } from "@/src/core/workspaces/model";

type Workspace = { id: string; name: string; type: WorkspaceType; role: string };
const icons = { commerce_business: ShoppingBag, business_showcase: Store, cv: FileUser, portfolio: BriefcaseBusiness } as const;

export function BusinessManager() {
  const [list, setList] = useState<Workspace[]>([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    fetch("/api/workspace").then((response) => response.json()).then((data) => {
      setList(data.workspaces || []);
      setActive(data.workspace?.id || "");
    });
  }, []);
  const choose = async (id: string) => {
    const response = await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    });
    if (response.ok) window.location.assign("/dashboard");
  };
  return <main className="admin-page"><header className="admin-page-header"><div><p>Account</p><h1>Workspaces</h1><span>Switch between businesses and personal sites.</span></div><Button asChild className="admin-primary"><Link href="/"><Plus className="size-4"/>Create workspace</Link></Button></header><section className="admin-card p-4"><div className="flex items-center justify-between border-b border-black/8 pb-4"><div><h2>Your workspaces</h2><p className="mt-1 text-xs text-black/40">{list.length} workspace{list.length === 1 ? "" : "s"}</p></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{list.map((workspace) => { const Icon = icons[workspace.type] || BriefcaseBusiness; return <button onClick={() => choose(workspace.id)} key={workspace.id} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${active === workspace.id ? "border-[#294b34] bg-[#f0f4f0]" : "border-black/10 hover:bg-black/[.015]"}`}><span className="grid size-9 place-items-center rounded-md bg-white shadow-sm"><Icon className="size-4"/></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{workspace.name}</strong><small className="text-[10px] text-black/40">{workspacePresets[workspace.type].label} · {workspace.role}</small></span>{active === workspace.id && <span className="flex items-center gap-1 text-[10px] font-semibold text-[#315b3d]"><Check className="size-3"/>Active</span>}</button>; })}</div></section></main>;
}
