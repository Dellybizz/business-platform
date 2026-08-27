"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Check, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const modes = [
  { id: "store", icon: ShoppingBag, label: "Online store", text: "Sell products, manage orders and accept payments.", tone: "bg-amber-100 text-amber-900" },
  { id: "services", icon: Wrench, label: "Service business", text: "Show services, capture leads and manage bookings.", tone: "bg-blue-100 text-blue-900" },
  { id: "portfolio", icon: BriefcaseBusiness, label: "Portfolio & CV", text: "Present your work, experience and capabilities.", tone: "bg-violet-100 text-violet-900" },
];

export default function Home() {
  const [selected, setSelected] = useState("store");
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const createWorkspace = async () => {
    setCreating(true);
    const response = await fetch("/api/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: selected, name: "North & Pine Studio" }) });
    if (response.status === 401) { window.top!.location.href = "/dashboard"; return; }
    if (!response.ok) { setCreating(false); return; }
    router.push("/dashboard");
  };
  return <main className="min-h-screen bg-[#f6f5f1] text-[#191a17]">
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
      <div className="flex items-center gap-3 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-[#18392b] text-white">M</span> Modulo</div>
      <a href="/dashboard" target="_top" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 hover:border-black/25">Sign in / Dashboard</a>
    </nav>
    <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-10 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:pt-20">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#dff2e5] px-3 py-1.5 text-sm font-medium text-[#18392b]"><Sparkles className="size-4"/> One platform, many businesses</span>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">Build the business website you actually need.</h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-black/55">Start with a store, service website, or portfolio. Add more capabilities whenever the business grows.</p>
        <div className="mt-8 space-y-3 text-sm text-black/65">{["Modular sections with no parent-file editing", "Custom domain and free subdomain ready", "Designed for commerce, bookings and portfolios"].map(x=><div className="flex items-center gap-3" key={x}><span className="grid size-6 place-items-center rounded-full bg-[#18392b] text-white"><Check className="size-3.5"/></span>{x}</div>)}</div>
      </div>
      <div className="rounded-[2rem] border border-black/8 bg-white p-5 shadow-[0_25px_70px_rgba(38,43,34,.12)] sm:p-8">
        <p className="text-sm font-medium text-black/45">CHOOSE A STARTING POINT</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">What are you building?</h2>
        <div className="mt-6 grid gap-3">{modes.map(({id,icon:Icon,label,text,tone})=><button key={id} onClick={()=>setSelected(id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected===id?"border-[#18392b] bg-[#f1f7f3] ring-1 ring-[#18392b]":"border-black/8 hover:border-black/20"}`}><span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="size-5"/></span><span className="flex-1"><strong className="block text-base">{label}</strong><span className="mt-1 block text-sm text-black/50">{text}</span></span>{selected===id&&<span className="grid size-6 place-items-center rounded-full bg-[#18392b] text-white"><Check className="size-4"/></span>}</button>)}</div>
        <Button onClick={createWorkspace} disabled={creating} className="mt-6 h-12 w-full rounded-xl bg-[#18392b] text-base hover:bg-[#10291f]">{creating?"Creating workspace…":"Create my workspace"} {!creating&&<ArrowRight className="ml-2 size-4"/>}</Button>
        <p className="mt-4 text-center text-xs text-black/40">You can activate other business modules later.</p>
      </div>
    </section>
  </main>;
}
