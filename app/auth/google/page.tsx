"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { startSupabaseGoogleOAuth } from "@/lib/auth/supabase-browser";

export default function GoogleLoginStartPage() {
  const [error, setError] = useState("");
  useEffect(() => { void (async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("returnTo");
      const returnTo = requested?.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/login") ? requested : "/dashboard";
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("returnTo", returnTo);
      await startSupabaseGoogleOAuth(callback.toString());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Google sign-in could not be started.");
    }
  })(); }, []);

  return <main className="grid min-h-screen place-items-center bg-[#f4f3ef] p-5"><section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-xl"><LoaderCircle className={`mx-auto size-7 text-[#294b34] ${error ? "" : "animate-spin"}`}/><h1 className="mt-5 text-2xl font-semibold">{error ? "Unable to start Google sign-in" : "Connecting to Google"}</h1><p className={`mt-3 text-sm ${error ? "text-red-700" : "text-black/55"}`}>{error || "You will be redirected securely."}</p>{error && <Link href="/login" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#294b34] text-white">Back to sign in</Link>}</section></main>;
}
