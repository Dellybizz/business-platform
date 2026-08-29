"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = useSearchParams().get("token") || "";
  const accept = async () => {
    if (!token) return;
    setLoading(true);
    const response = await fetch("/api/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    if (response.status === 401) return window.location.assign(`/login?returnTo=${encodeURIComponent(`/invite?token=${token}`)}`);
    const data = await response.json() as { error?: string; dashboardUrl?: string };
    setLoading(false);
    if (!response.ok) return setMessage(data.error || "Invitation could not be accepted");
    window.location.assign(data.dashboardUrl || "/dashboard");
  };
  const missingToken = !token;
  return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] p-5"><section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-xl"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e8efe9] text-[#294b34]"><UserPlus/></span><h1 className="mt-5 text-2xl font-semibold">{missingToken ? "Invitation link required" : "Workspace invitation"}</h1><p className="mt-2 text-sm text-black/50">{missingToken ? "This page only works from a workspace invitation link. Return to Modulo to create or open your workspace." : "Sign in with the invited email, then accept access to the workspace."}</p>{message && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}{missingToken ? <Button asChild className="mt-6 h-11 w-full bg-[#294b34] hover:bg-[#1f3d29]"><Link href="/"><ArrowLeft className="mr-2 size-4"/>Go to Modulo</Link></Button> : <Button onClick={accept} disabled={loading} className="mt-6 h-11 w-full bg-[#294b34] hover:bg-[#1f3d29]">{loading ? "Accepting…" : "Accept invitation"}</Button>}{!missingToken && <Link href="/" className="mt-4 inline-block text-xs text-black/40 hover:text-black/70">Back to Modulo</Link>}</section></main>;
}
