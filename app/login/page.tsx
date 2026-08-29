"use client";
import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") || "";
  const accept = async () => {"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register" | "recover";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const returnTo = typeof window === "undefined" ? "/dashboard" : new URLSearchParams(window.location.search).get("returnTo") || "/dashboard";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const endpoint = mode === "register" ? "register" : mode === "recover" ? "recover" : "login";
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await response.json() as { error?: string; recoveryCode?: string };
    setLoading(false);
    if (!response.ok) return setError(data.error || "Request failed");
    if (data.recoveryCode) return setRecoveryCode(data.recoveryCode);
    window.location.assign(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard");
  };
  if (recoveryCode) return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] p-5"><section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-xl"><ShieldCheck className="size-10 text-[#294b34]"/><h1 className="mt-5 text-2xl font-semibold">Save your recovery code</h1><p className="mt-2 text-sm leading-6 text-black/55">Store this code somewhere safe. It is the only way to reset your password without email delivery.</p><code className="mt-5 block break-all rounded-xl bg-[#f1f3ef] p-4 text-sm">{recoveryCode}</code><Button onClick={() => window.location.assign(returnTo)} className="mt-6 h-11 w-full bg-[#294b34]">I saved it—continue</Button></section></main>;
  return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] p-5"><section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-xl sm:p-8"><Link href="/" className="text-sm font-semibold">← Modulo</Link><span className="mt-8 grid size-11 place-items-center rounded-xl bg-[#e8efe9] text-[#294b34]"><KeyRound className="size-5"/></span><h1 className="mt-4 text-2xl font-semibold">{mode === "register" ? "Create your account" : mode === "recover" ? "Recover your account" : "Sign in"}</h1><p className="mt-2 text-sm text-black/50">{mode === "register" ? "Create secure access before building your workspace." : mode === "recover" ? "Use the recovery code you saved when registering." : "Access your workspaces and dashboard."}</p><form onSubmit={submit} className="mt-6 space-y-4">{mode === "register" && <label className="block text-xs font-semibold">Your name<Input required name="displayName" className="mt-1.5"/></label>}<label className="block text-xs font-semibold">Email<Input required type="email" name="email" className="mt-1.5"/></label>{mode === "recover" && <label className="block text-xs font-semibold">Recovery code<Input required name="recoveryCode" className="mt-1.5"/></label>}<label className="block text-xs font-semibold">{mode === "recover" ? "New password" : "Password"}<Input required minLength={10} type="password" name={mode === "recover" ? "newPassword" : "password"} className="mt-1.5"/></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}<Button disabled={loading} className="h-11 w-full bg-[#294b34]">{loading ? "Please wait…" : mode === "register" ? "Create account" : mode === "recover" ? "Reset password" : "Sign in"}</Button></form><div className="mt-5 flex flex-wrap justify-between gap-3 text-xs"><button onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }} className="text-[#294b34]">{mode === "register" ? "Already registered? Sign in" : "Create an account"}</button><button onClick={() => { setMode(mode === "recover" ? "login" : "recover"); setError(""); }} className="text-black/45">{mode === "recover" ? "Back to sign in" : "Forgot password?"}</button></div></section></main>;
}

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
