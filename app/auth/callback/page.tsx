"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { exchangeSupabaseCode } from "@/lib/auth/supabase-browser";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const providerError = params.get("error_description") || params.get("error");
        if (providerError) throw new Error(providerError);
        const code = params.get("code");
        if (!code) throw new Error("The sign-in response did not include an authorization code.");

        const { accessToken } = await exchangeSupabaseCode(code);
        const response = await fetch("/api/auth/supabase", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
        const payload = response.headers.get("content-type")?.includes("application/json")
          ? await response.json() as { error?: string }
          : {};
        if (!response.ok) throw new Error(payload.error || "The app could not create your session.");

        const target = params.get("returnTo");
        window.location.replace(target?.startsWith("/") && !target.startsWith("//") && !target.startsWith("/login") ? target : "/dashboard");
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Google sign-in could not be completed.");
      }
    })();
    return () => { active = false; };
  }, []);

  return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] p-5"><section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-xl"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#e8efe9] text-[#294b34]">{error ? <ShieldCheck className="size-6"/> : <LoaderCircle className="size-6 animate-spin"/>}</span><h1 className="mt-5 text-2xl font-semibold">{error ? "Sign-in could not be completed" : "Finishing your sign-in"}</h1><p className={`mt-3 text-sm leading-6 ${error ? "text-red-700" : "text-black/55"}`}>{error || "Google has verified your identity. We are securely opening your Modulo workspace."}</p>{error && <Link href="/login" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#294b34] px-4 font-medium text-white">Back to sign in</Link>}</section></main>;
}
