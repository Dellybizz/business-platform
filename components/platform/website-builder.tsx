"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  GripVertical,
  Layers3,
  Monitor,
  Palette,
  Plus,
  Save,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  sectionRegistry,
  availableSections,
  createSection,
} from "@/lib/builder/registry";
import type { SiteSection } from "@/lib/builder/types";
import { themeStyle } from "@/lib/themes/registry";
import { BlockEditor } from "@/components/platform/block-editor";

const initial: SiteSection[] = ["hero","features","callout"].flatMap((type,index)=>{
  const definition=sectionRegistry[type],preset=definition?.presets[0];
  return definition&&preset?[{id:`initial-${index}-${type}`,type,settings:{...definition.defaults,...preset.settings},blocks:[]}]:[];
});
export function WebsiteBuilder({pageSlug}:{pageSlug:string}) {
  const [sections, setSections] = useState(initial),
    [active, setActive] = useState(initial[0].id),
    [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [themeId, setThemeId] = useState("atelier"),
    [mode, setMode] = useState("store");
  const [workspaceSlug,setWorkspaceSlug]=useState("");
  const [published,setPublished]=useState(false);
  const [saveState, setSaveState] = useState<
    "loading" | "saved" | "saving" | "error"
  >("loading");
  const loaded = useRef(false);
  useEffect(() => {
    fetch(`/api/workspace?page=${encodeURIComponent(pageSlug)}`)
      .then(async(r) => {const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load page");return d;})
      .then((d) => {
        if (d.page?.sections?.length) {
          setSections(d.page.sections);
          setActive(d.page.sections[0].id);
        }
        setThemeId(d.workspace?.themeId || "atelier");
        setMode(d.workspace?.mode || "store");
        setWorkspaceSlug(d.workspace?.slug||"");
        setSaveState("saved");
        loaded.current = true;
      })
      .catch(() => setSaveState("error"));
  }, [pageSlug]);
  useEffect(() => {
    if (!loaded.current) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      fetch("/api/workspace", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sections, pageSlug }),
      })
        .then((r) => {
          if (!r.ok) throw new Error();
          setSaveState("saved");
        })
        .catch(() => setSaveState("error"));
    }, 600);
    return () => clearTimeout(timer);
  }, [sections, pageSlug]);
  const current = sections.find((s) => s.id === active),
    def = current ? sectionRegistry[current.type] : null;
  const move = (index: number, dir: number) => {
    const next = [...sections],
      target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  };
  const update = (key: string, value: string) =>
    setSections((x) =>
      x.map((s) =>
        s.id === active
          ? { ...s, settings: { ...s.settings, [key]: value } }
          : s,
      ),
    );
  const publish = async () => {
    setSaveState("saving");
    const response=await fetch("/api/workspace", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sections, status: "published", pageSlug }),
    });
    if(!response.ok){setSaveState("error");return;}
    setSaveState("saved");
    setPublished(true);
  };
  const liveHref=workspaceSlug?`/s/${workspaceSlug}${pageSlug==="home"?"":`/${pageSlug}`}`:"";
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#eceee9] text-[#1b1d19]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white px-3 sm:px-5">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost">
            <Link href="/pages">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm font-semibold">{pageSlug==="home"?"Homepage":pageSlug.replace(/-/g," ")}</p>
            <p
              className={`text-[11px] ${saveState === "error" ? "text-red-600" : "text-black/40"}`}
            >
              {saveState === "loading"
                ? "Loading workspace…"
                : saveState === "saving"
                  ? "Saving changes…"
                  : saveState === "error"
                    ? "Could not save"
                    : "All changes saved"}
            </p>
          </div>
        </div>
        <div className="hidden rounded-lg bg-[#f1f2ee] p-1 sm:flex">
          <button
            onClick={() => setDevice("desktop")}
            className={`rounded-md p-2 ${device === "desktop" ? "bg-white shadow-sm" : "text-black/40"}`}
          >
            <Monitor className="size-4" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`rounded-md p-2 ${device === "mobile" ? "bg-white shadow-sm" : "text-black/40"}`}
          >
            <Smartphone className="size-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-xl sm:w-auto sm:px-4"
          >
            <Link href="/themes" aria-label="Choose theme">
              <Palette className="size-4" />
              <span className="hidden sm:inline">Themes</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="hidden rounded-xl sm:flex"
          >
            <Link href={liveHref||"/pages"} target={liveHref?"_blank":undefined}>
              <Eye className="size-4" />
              Preview
            </Link>
          </Button>
          <Button onClick={publish} className="rounded-xl bg-[#173a2b]">
            <Save className="size-4" />
            Publish
          </Button>
          {published&&liveHref?<Button asChild variant="outline" className="rounded-xl"><Link href={liveHref} target="_blank"><Eye className="size-4"/>View live</Link></Button>:null}
        </div>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_1fr_310px]">
        <aside className="hidden overflow-y-auto border-r border-black/10 bg-white p-4 lg:block">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Page sections</p>
            <Layers3 className="size-4 text-black/35" />
          </div>
          <div className="mt-4 space-y-2">
            {sections.map((s, i) => {
              const registered = sectionRegistry[s.type];
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`group flex w-full items-center gap-2 rounded-xl border p-3 text-left ${active === s.id ? "border-[#173a2b] bg-[#eff5f1]" : "border-black/8"}`}
                >
                  <GripVertical className="size-4 text-black/25" />
                  <span className="flex-1 text-sm font-medium">
                    {registered?.name || "Unavailable section"}
                  </span>
                  <span className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, -1);
                      }}
                      className="p-1"
                    >
                      <ChevronUp className="size-3" />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, 1);
                      }}
                      className="p-1"
                    >
                      <ChevronDown className="size-3" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-7 text-xs font-semibold uppercase tracking-wider text-black/35">
            Add a section
          </p>
          <div className="mt-3 space-y-2">
            {availableSections(mode).flatMap((d) =>
              d.presets.map((preset, presetIndex) => (
                <button
                  key={`${d.type}-${preset.name}`}
                  onClick={() => {
                    const s = createSection(d.type, presetIndex);
                    setSections((x) => [...x, s]);
                    setActive(s.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed border-black/15 p-3 text-left hover:bg-[#f7f7f4]"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-[#edf1eb]">
                    <Plus className="size-4" />
                  </span>
                  <span>
                    <strong className="block text-sm">{preset.name}</strong>
                    <small className="text-black/40">{d.category}</small>
                  </span>
                </button>
              )),
            )}
          </div>
        </aside>
        <section className="overflow-y-auto p-4 sm:p-8">
          <div
            style={themeStyle(themeId)}
            className={`tenant-theme mx-auto min-h-full overflow-hidden shadow-[0_20px_60px_rgba(30,35,28,.14)] transition-all ${device === "mobile" ? "max-w-[390px] rounded-[2rem] border-[7px] border-[#252723]" : "max-w-5xl rounded-xl"}`}
          >
            <div className="flex h-14 items-center justify-between border-b border-black/8 px-6">
              <strong className="text-sm">North & Pine</strong>
              <span className="text-xs text-black/45">
                Work&nbsp;&nbsp; Services&nbsp;&nbsp; Contact
              </span>
            </div>
            {sections.map((s) => {
              const definition = sectionRegistry[s.type];
              if (!definition) return null;
              const C = definition.component;
              return (
                <div
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`cursor-pointer outline-offset-[-2px] ${active === s.id ? "outline-2 outline-[#3b7c5a]" : "hover:outline hover:outline-1 hover:outline-black/20"}`}
                >
                  <C settings={s.settings} blocks={s.blocks} />
                </div>
              );
            })}
          </div>
        </section>
        <aside className="hidden overflow-y-auto border-l border-black/10 bg-white p-5 lg:block">
          {current && def ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/35">
                Selected section
              </p>
              <h2 className="mt-2 text-lg font-semibold">{def.name}</h2>
              <p className="mt-1 text-xs leading-5 text-black/45">
                {def.description}
              </p>
              <div className="mt-6 space-y-5">
                {def.fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-2 block text-xs font-medium">
                      {f.label}
                    </span>
                    {f.type === "textarea" ? (
                      <Textarea
                        value={current.settings[f.key]}
                        onChange={(e) => update(f.key, e.target.value)}
                        className="min-h-24 rounded-xl"
                      />
                    ) : f.type === "color" ? (
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={current.settings[f.key]}
                          onChange={(e) => update(f.key, e.target.value)}
                          className="h-10 w-12 rounded-lg border p-1"
                        />
                        <Input
                          value={current.settings[f.key]}
                          onChange={(e) => update(f.key, e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    ) : (
                      <Input
                        value={current.settings[f.key]}
                        onChange={(e) => update(f.key, e.target.value)}
                        className="rounded-xl"
                      />
                    )}
                  </label>
                ))}
              </div>
              <BlockEditor
                section={current}
                definition={def}
                onChange={(next) =>
                  setSections((items) =>
                    items.map((item) => (item.id === next.id ? next : item)),
                  )
                }
              />
              <div className="mt-8 flex gap-2 border-t pt-5">
                <Button variant="outline" className="flex-1 rounded-xl">
                  <Copy className="size-4" />
                  Duplicate
                </Button>
                <Button
                  onClick={() => {
                    setSections((x) => x.filter((s) => s.id !== active));
                    setActive(sections.find((s) => s.id !== active)?.id || "");
                  }}
                  variant="outline"
                  size="icon"
                  className="rounded-xl text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-black/40">
              Select a section to edit it.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
