"use client";
import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") || "";
  const accept = async () => {
    setLoading(true);
    const response = await fetch("/api/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    if (response.status === 401) return window.location.assign(`/login?returnTo=${encodeURIComponent(`/invite?token=${token}`)}`);
    const data = await response.json() as { error?: string; dashboardUrl?: string };
    setLoading(false);
    if (!response.ok) return setMessage(data.error || "Invitation could not be accepted");
    window.location.assign(data.dashboardUrl || "/dashboard");
  };
  return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] p-5"><section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-xl"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e8efe9] text-[#294b34]"><UserPlus/></span><h1 className="mt-5 text-2xl font-semibold">Workspace invitation</h1><p className="mt-2 text-sm text-black/50">Sign in with the invited email, then accept access to the workspace.</p>{message && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}<Button onClick={accept} disabled={loading || !token} className="mt-6 h-11 w-full bg-[#294b34]">{loading ? "Accepting…" : "Accept invitation"}</Button><Link href="/" className="mt-4 inline-block text-xs text-black/40">Back to Modulo</Link></section></main>;
}
