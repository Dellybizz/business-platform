"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register" | "recover";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return "";
    const reason = new URLSearchParams(window.location.search).get("oauthError");
    if (reason === "configuration") return "Google login has not been configured yet.";
    if (reason === "cancelled") return "Google sign-in was cancelled.";
    if (reason) return "Google sign-in could not be completed. Please try again.";
    return "";
  });
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
  return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] p-5"><section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-xl sm:p-8"><Link href="/" className="text-sm font-semibold">← Modulo</Link><span className="mt-8 grid size-11 place-items-center rounded-xl bg-[#e8efe9] text-[#294b34]"><KeyRound className="size-5"/></span><h1 className="mt-4 text-2xl font-semibold">{mode === "register" ? "Create your account" : mode === "recover" ? "Recover your account" : "Sign in"}</h1><p className="mt-2 text-sm text-black/50">{mode === "register" ? "Create secure access before building your workspace." : mode === "recover" ? "Use the recovery code you saved when registering." : "Access your workspaces and dashboard."}</p>{mode !== "recover" && <><Button asChild variant="outline" className="mt-6 h-11 w-full border-black/15 bg-white text-black hover:bg-black/[.03]"><a href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}><GoogleMark/>{mode === "register" ? "Sign up with Google" : "Continue with Google"}</a></Button><div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[.12em] text-black/35"><span className="h-px flex-1 bg-black/10"/>or continue with email<span className="h-px flex-1 bg-black/10"/></div></>}<form onSubmit={submit} className={mode === "recover" ? "mt-6 space-y-4" : "space-y-4"}>{mode === "register" && <label className="block text-xs font-semibold">Your name<Input required name="displayName" className="mt-1.5"/></label>}<label className="block text-xs font-semibold">Email<Input required type="email" name="email" className="mt-1.5"/></label>{mode === "recover" && <label className="block text-xs font-semibold">Recovery code<Input required name="recoveryCode" className="mt-1.5"/></label>}<label className="block text-xs font-semibold">{mode === "recover" ? "New password" : "Password"}<Input required minLength={10} type="password" name={mode === "recover" ? "newPassword" : "password"} className="mt-1.5"/></label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}<Button disabled={loading} className="h-11 w-full bg-[#294b34]">{loading ? "Please wait…" : mode === "register" ? "Create account" : mode === "recover" ? "Reset password" : "Sign in"}</Button></form><div className="mt-5 flex flex-wrap justify-between gap-3 text-xs"><button onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }} className="text-[#294b34]">{mode === "register" ? "Already registered? Sign in" : "Create an account"}</button><button onClick={() => { setMode(mode === "recover" ? "login" : "recover"); setError(""); }} className="text-black/45">{mode === "recover" ? "Back to sign in" : "Forgot password?"}</button></div></section></main>;
}

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z"/><path fill="#EA4335" d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"/></svg>;
}
