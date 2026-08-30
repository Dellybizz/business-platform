"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sectionRegistry } from "@/lib/builder/registry";
import type { SiteSection } from "@/lib/builder/types";
type Item = { id: string; title: string; description: string; price: number };
const copy = {
  store: {
    heading: "Featured products",
    action: "Order",
    type: "order",
    form: "Place an order request",
    icon: ShoppingBag,
  },
  services: {
    heading: "Our services",
    action: "Book",
    type: "booking",
    form: "Request a booking",
    icon: Wrench,
  },
  portfolio: {
    heading: "Selected projects",
    action: "Enquire",
    type: "enquiry",
    form: "Start a project enquiry",
    icon: BriefcaseBusiness,
  },
} as const;
export function PublicSite({ slug, pageSlug="home" }: { slug: string; pageSlug?:string }) {
  const [data, setData] = useState<{
      workspace: { name: string; mode: keyof typeof copy };
      page: { title:string; sections: SiteSection[]; seo?:{title?:string|null;description?:string|null;indexable?:boolean} };
      items: Item[];
      navigation:Array<{id:string;parentId?:string|null;label:string;url:string;position:number}>;
    } | null>(null),
    [selected, setSelected] = useState<Item | null>(null),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/public/${slug}?page=${encodeURIComponent(pageSlug)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [slug, pageSlug]);
  useEffect(()=>{if(!data)return;document.title=data.page.seo?.title||data.page.title||data.workspace.name;let meta=document.querySelector<HTMLMetaElement>('meta[name="description"]');if(!meta){meta=document.createElement("meta");meta.name="description";document.head.append(meta);}meta.content=data.page.seo?.description||"";let robots=document.querySelector<HTMLMetaElement>('meta[name="robots"]');if(!robots){robots=document.createElement("meta");robots.name="robots";document.head.append(robots);}robots.content=data.page.seo?.indexable===false?"noindex,nofollow":"index,follow";},[data]);
  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f6f2]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Site unavailable</h1>
          <p className="mt-2 text-black/50">{error}</p>
        </div>
      </main>
    );
  if (!data)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f6f2] text-sm text-black/40">
        Loading website…
      </main>
    );
  const labels = copy[data.workspace.mode],
    Icon = labels.icon;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      r = await fetch(`/api/public/${slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: labels.type,
          itemId: selected?.id,
          itemTitle: selected?.title,
          customerName: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          message: f.get("message"),
        }),
      });
    if (r.ok) setSent(true);
  };
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#191a17]">
      <header className="flex h-16 items-center justify-between border-b border-black/8 px-6 lg:px-12">
        <strong>{data.workspace.name}</strong>
        <nav aria-label="Main navigation" className="text-sm text-black/50"><ul className="flex gap-5">{(data.navigation||[]).filter(item=>!item.parentId).map(item=><li key={item.id} className="relative"><a href={item.url}>{item.label}</a>{data.navigation.some(child=>child.parentId===item.id)&&<ul className="absolute right-0 z-20 mt-2 min-w-40 rounded-xl border bg-white p-2 shadow-lg">{data.navigation.filter(child=>child.parentId===item.id).map(child=><li key={child.id}><a className="block rounded-lg px-3 py-2 hover:bg-black/5" href={child.url}>{child.label}</a></li>)}</ul>}</li>)}</ul></nav>
      </header>
      {data.page.sections.map((s) => {
        const def = sectionRegistry[s.type];
        if (!def) return null;
        const C = def.component;
        return <C key={s.id} settings={s.settings} blocks={s.blocks} />;
      })}
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-black/35">
            Explore
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{labels.heading}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-black/8 bg-white"
              >
                <div className="grid aspect-[4/3] place-items-center bg-[#e8eee7]">
                  <Icon className="size-10 text-[#264d38]/45" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 min-h-10 text-sm text-black/50">
                    {item.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    {item.price > 0 ? (
                      <strong>₹{item.price.toLocaleString("en-IN")}</strong>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => {
                        setSelected(item);
                        document
                          .getElementById("public-enquiry")
                          ?.scrollIntoView({ behavior: "smooth" });
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
        </div>
      </section>
      <section id="public-enquiry" className="bg-[#e4ece5] px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#315c43]">
              Contact
            </p>
            <h2 className="mt-3 text-4xl font-semibold">{labels.form}</h2>
            <p className="mt-4 text-black/55">
              {selected
                ? `Selected: ${selected.title}`
                : "Send a general enquiry."}
            </p>
          </div>
          {sent ? (
            <div className="grid min-h-72 place-items-center rounded-3xl bg-white text-center">
              <div>
                <CheckCircle2 className="mx-auto size-10 text-[#2f704b]" />
                <h3 className="mt-4 text-xl font-semibold">Request received</h3>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="space-y-3 rounded-3xl bg-white p-6"
            >
              <Input required name="name" placeholder="Your name" />
              <Input
                required
                type="email"
                name="email"
                placeholder="Email address"
              />
              <Input name="phone" placeholder="Phone number" />
              <Textarea name="message" placeholder="Message" />
              <Button className="w-full bg-[#173a2b]">Send request</Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
