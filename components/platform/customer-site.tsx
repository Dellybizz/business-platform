"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sectionRegistry } from "@/lib/builder/registry";
import type { SiteSection } from "@/lib/builder/types";
type Item = { id: string; title: string; description: string; price: number };
const copy = {
  store: {
    heading: "Featured products",
    empty: "Products will appear here.",
    action: "Order",
    type: "order",
    form: "Place an order request",
    icon: ShoppingBag,
  },
  services: {
    heading: "Our services",
    empty: "Services will appear here.",
    action: "Book",
    type: "booking",
    form: "Request a booking",
    icon: Wrench,
  },
  portfolio: {
    heading: "Selected projects",
    empty: "Projects will appear here.",
    action: "Enquire",
    type: "enquiry",
    form: "Start a project enquiry",
    icon: BriefcaseBusiness,
  },
} as const;
export function CustomerSite() {
  const [sections, setSections] = useState<SiteSection[]>([]),
    [items, setItems] = useState<Item[]>([]),
    [mode, setMode] = useState<keyof typeof copy>("store"),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState<Item | null>(null),
    [sent, setSent] = useState(false),
    [sending, setSending] = useState(false);
  useEffect(() => {
    Promise.all([
      fetch("/api/workspace").then((r) => r.json()),
      fetch("/api/items").then((r) => r.json()),
    ])
      .then(([w, i]) => {
        setSections(w.page?.sections || []);
        setItems(i.items || []);
        setMode(i.mode || "store");
      })
      .finally(() => setLoading(false));
  }, []);
  const labels = copy[mode],
    Icon = labels.icon;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    const data = new FormData(e.currentTarget);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: labels.type,
        itemId: selected?.id,
        itemTitle: selected?.title || "General enquiry",
        customerName: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        message: data.get("message"),
      }),
    });
    setSending(false);
    if (response.ok) {
      setSent(true);
      e.currentTarget.reset();
    }
  };
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#191a17]">
      <div className="fixed left-4 top-4 z-20">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm shadow-sm backdrop-blur"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
      </div>
      <header className="flex h-16 items-center justify-between border-b border-black/8 px-6 lg:px-12">
        <strong>North & Pine</strong>
        <nav className="text-sm text-black/50">
          Home&nbsp;&nbsp;&nbsp; About&nbsp;&nbsp;&nbsp; Contact
        </nav>
      </header>
      {loading ? (
        <div className="grid min-h-[60vh] place-items-center text-sm text-black/40">
          Loading website…
        </div>
      ) : (
        <>
          {sections.map((s) => {
            const definition = sectionRegistry[s.type];
            if (!definition) return null;
            const C = definition.component;
            return <C key={s.id} settings={s.settings} blocks={s.blocks} />;
          })}
          <section className="px-6 py-16 lg:px-12">
            <div className="mx-auto max-w-6xl">
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-black/35">
                Explore
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {labels.heading}
              </h2>
              {items.length === 0 ? (
                <div className="mt-7 rounded-3xl border border-dashed border-black/15 p-12 text-center text-black/40">
                  {labels.empty}
                </div>
              ) : (
                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className={`overflow-hidden rounded-3xl border bg-white ${selected?.id === item.id ? "border-[#173a2b] ring-2 ring-[#173a2b]/20" : "border-black/8"}`}
                    >
                      <div className="grid aspect-[4/3] place-items-center bg-[#e8eee7]">
                        <Icon className="size-10 text-[#264d38]/45" />
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 min-h-10 text-sm leading-5 text-black/50">
                          {item.description ||
                            "Discover more about this offering."}
                        </p>
                        <div className="mt-5 flex items-center justify-between">
                          {item.price > 0 ? (
                            <span className="font-semibold">
                              ₹{item.price.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span />
                          )}
                          <button
                            onClick={() => {
                              setSelected(item);
                              setSent(false);
                              setTimeout(
                                () =>
                                  document
                                    .getElementById("customer-form")
                                    ?.scrollIntoView({ behavior: "smooth" }),
                                50,
                              );
                            }}
                            className="rounded-full bg-[#173a2b] px-4 py-2 text-xs font-medium text-white"
                          >
                            {labels.action}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
          <section
            id="customer-form"
            className="bg-[#e4ece5] px-6 py-16 lg:px-12"
          >
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#315c43]">
                  Get in touch
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  {labels.form}
                </h2>
                <p className="mt-4 text-black/55">
                  {selected
                    ? `Selected: ${selected.title}`
                    : "Choose an item above, or send a general enquiry."}
                </p>
              </div>
              {sent ? (
                <div className="grid min-h-72 place-items-center rounded-3xl bg-white p-8 text-center">
                  <div>
                    <CheckCircle2 className="mx-auto size-10 text-[#2f704b]" />
                    <h3 className="mt-4 text-xl font-semibold">
                      Request received
                    </h3>
                    <p className="mt-2 text-sm text-black/50">
                      The business can now see it in their dashboard inbox.
                    </p>
                    <Button
                      onClick={() => setSent(false)}
                      variant="outline"
                      className="mt-5 rounded-xl"
                    >
                      Send another
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  className="space-y-3 rounded-3xl bg-white p-6"
                >
                  <Input
                    required
                    name="name"
                    placeholder="Your name"
                    className="rounded-xl"
                  />
                  <Input
                    required
                    type="email"
                    name="email"
                    placeholder="Email address"
                    className="rounded-xl"
                  />
                  <Input
                    name="phone"
                    placeholder="Phone number"
                    className="rounded-xl"
                  />
                  <Textarea
                    name="message"
                    placeholder="Add a message"
                    className="min-h-24 rounded-xl"
                  />
                  <Button
                    disabled={sending}
                    className="w-full rounded-xl bg-[#173a2b]"
                  >
                    {sending ? "Sending…" : labels.form}
                  </Button>
                </form>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
