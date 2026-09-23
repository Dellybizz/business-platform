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
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sectionRegistry,
  availableSections,
  createSection,
} from "@/lib/builder/registry";
import type { SiteSection } from "@/lib/builder/types";
import { themeStyle } from "@/lib/themes/registry";
import { BlockEditor } from "@/components/platform/block-editor";
import {RegisteredSectionRenderer} from "@/lib/builder/registered-renderer";
import {ManifestField} from "@/components/platform/manifest-field";
import type {SettingValue} from "@/lib/builder/types";
import type{PageDocument,PageSection}from"@/src/website/page-document";
import{useEditorDocument}from"@/lib/editor/use-editor-document";
import{duplicateSection,insertSection,removeSection,reorderSection}from"@/lib/editor/document-state";
import{editorTemplate,insertReusableSection,moveSection,reusableSections,sanitizeCustomCss,saveReusableSection,synchronizeGlobalSection,updateResponsiveStyles,type EditorBreakpoint}from"@/lib/editor/advanced-editor";

const initialSections: SiteSection[] = ["hero","features","callout"].flatMap((type,index)=>{
  const definition=sectionRegistry[type],preset=definition?.presets[0];
  return definition&&preset?[{id:`initial-${index}-${type}`,type,settings:{...definition.defaults,...preset.settings},blocks:[]}]:[];
});
const initial:PageDocument={schemaVersion:2,editorMode:"advanced",dataSources:{},globalTokens:{},sections:initialSections as PageSection[]};
export function WebsiteBuilder({pageSlug}:{pageSlug:string}) {
  const{document,setDocument,resetDocument,undo,redo,canUndo,canRedo}=useEditorDocument(initial);
  const sections=document.sections as SiteSection[];
  const setSections=(next:SiteSection[]|((current:SiteSection[])=>SiteSection[]))=>setDocument(current=>({...current,sections:(typeof next==="function"?next(current.sections as SiteSection[]):next)as PageSection[]}));
  const [active, setActive] = useState(initialSections[0].id),
    [device, setDevice] = useState<EditorBreakpoint>("desktop");
  const [mobilePanel,setMobilePanel]=useState<"structure"|"settings"|null>(null),[dragged,setDragged]=useState("");
  const [pages,setPages]=useState<Array<{id:string;slug:string;title:string}>>([]),[cssError,setCssError]=useState("");
  const [themeId, setThemeId] = useState("atelier"),
    [mode, setMode] = useState("store");
  const [workspaceSlug,setWorkspaceSlug]=useState("");
  const [pageId,setPageId]=useState("");
  const [published,setPublished]=useState(false);
  const [saveState, setSaveState] = useState<
    "loading" | "saved" | "saving" | "error"
  >("loading");
  const loaded = useRef(false);
  useEffect(() => {
    fetch("/api/pages").then(response=>response.ok?response.json():null).then(data=>setPages(data?.pages||[])).catch(()=>{});
    fetch(`/api/workspace?page=${encodeURIComponent(pageSlug)}`)
      .then(async(r) => {const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load page");return d;})
      .then((d) => {
        if (d.page?.document) {
          resetDocument(d.page.document);
          setActive(d.page.document.sections[0]?.id||"");
          setPageId(d.page.id);
        }
        setThemeId(d.workspace?.themeId || "atelier");
        setMode(d.workspace?.mode || "store");
        setWorkspaceSlug(d.workspace?.slug||"");
        setSaveState("saved");
        loaded.current = true;
      })
      .catch(() => setSaveState("error"));
  }, [pageSlug,resetDocument]);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(!(event.ctrlKey||event.metaKey))return;if(event.key.toLowerCase()==="z"){event.preventDefault();if(event.shiftKey)redo();else undo()}else if(event.key.toLowerCase()==="y"){event.preventDefault();redo()}};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler)},[undo,redo]);
  useEffect(() => {
    if (!loaded.current) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({document}),
      })
        .then((r) => {
          if (!r.ok) throw new Error();
          setSaveState("saved");
        })
        .catch(() => setSaveState("error"));
    }, 600);
    return () => clearTimeout(timer);
  }, [document,pageId]);
  const current = sections.find((s) => s.id === active),
    def = current ? sectionRegistry[current.type] : null;
  const move = (index: number, dir: number) => {
    const section=sections[index];if(section)setDocument(current=>reorderSection(current,section.id,dir as -1|1));
  };
  const update = (key: string, value: SettingValue) =>
    setSections((x) =>
      x.map((s) =>
        s.id === active
          ? { ...s, settings: { ...s.settings, [key]: value } }
          : s,
      ),
    );
  const saveNow=async()=>{if(!pageId)return false;setSaveState("saving");const response=await fetch(`/api/pages/${pageId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({document})});setSaveState(response.ok?"saved":"error");return response.ok};
  const publish = async () => {
    if(!pageId||!await saveNow())return;
    const response=await fetch(`/api/pages/${pageId}/publish`, {method:"POST",headers:{"content-type":"application/json"}});
    if(!response.ok){setSaveState("error");return;}
    setSaveState("saved");
    setPublished(true);
  };
  const preview=async()=>{if(!pageId||!workspaceSlug||!await saveNow())return;const response=await fetch(`/api/pages/${pageId}/preview`,{method:"POST"}),data=await response.json();if(!response.ok){setSaveState("error");return}window.open(`${liveHref}?preview=${encodeURIComponent(data.token)}`,"_blank","noopener,noreferrer")};
  const changeMode=async(mode:"guided"|"advanced")=>{if(!pageId||!await saveNow())return;const response=await fetch(`/api/pages/${pageId}/editor-mode`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode})});if(!response.ok){setSaveState("error");return}setDocument(current=>({...current,editorMode:mode}))};
  const applyTemplate=async(kind:"product"|"collection"|"standard")=>{if(!pageId)return;const next={...document,editorMode:"advanced" as const,sections:editorTemplate(kind,(type)=>createSection(type)as PageSection)};const response=await fetch(`/api/pages/${pageId}/layout`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({document:next})});if(!response.ok){setSaveState("error");return}resetDocument(next);setActive(next.sections[0]?.id||"");setSaveState("saved")};
  const updateAdvancedStyle=(values:Record<string,string|number|boolean|undefined>)=>current&&setDocument(value=>synchronizeGlobalSection(value,updateResponsiveStyles(current,device,values)as PageSection));
  const changeSection=(next:SiteSection)=>setDocument(value=>synchronizeGlobalSection(value,next as PageSection));
  const saveReusable=()=>{if(!current)return;const name=window.prompt("Name this reusable section",def?.name||"Reusable section");if(name)setDocument(value=>saveReusableSection(value,current.id,name))};
  const changeCss=(value:string)=>{try{const safe=value.trim()?sanitizeCustomCss(value):"";setCssError("");setDocument(current=>({...current,globalTokens:{...current.globalTokens,"advanced.customCss":safe}}))}catch(error){setCssError(error instanceof Error?error.message:"Custom CSS is invalid")}};
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
          <button onClick={()=>setDevice("tablet")} aria-label="Tablet preview" className={`rounded-md p-2 ${device==="tablet"?"bg-white shadow-sm":"text-black/40"}`}><Tablet className="size-4"/></button>
        </div>
        <div className="flex gap-2">
          <select aria-label="Editor level" value={document.editorMode} onChange={event=>changeMode(event.target.value as "guided"|"advanced")} className="rounded-xl border bg-white px-3 text-sm"><option value="guided">Guided</option><option value="advanced">Advanced</option></select>
          <Button onClick={undo} disabled={!canUndo} variant="outline" size="icon" aria-label="Undo last change"><Undo2 className="size-4"/></Button>
          <Button onClick={redo} disabled={!canRedo} variant="outline" size="icon" aria-label="Redo last change"><Redo2 className="size-4"/></Button>
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
          <Button onClick={preview} variant="outline" className="hidden rounded-xl sm:flex">
              <Eye className="size-4" />
              Preview
          </Button>
          <Button onClick={saveNow} variant="outline" className="rounded-xl"><Save className="size-4"/><span className="hidden sm:inline">Save</span></Button>
          <Button onClick={publish} className="rounded-xl bg-[#173a2b]">
            <Save className="size-4" />
            Publish
          </Button>
          {published&&liveHref?<Button asChild variant="outline" className="rounded-xl"><Link href={liveHref} target="_blank"><Eye className="size-4"/>View live</Link></Button>:null}
        </div>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_1fr_310px]">
        <aside className={`${mobilePanel==="structure"?"fixed inset-0 z-50 block":"hidden"} overflow-y-auto border-r border-black/10 bg-white p-4 lg:static lg:block`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Page sections</p>
            <div className="flex items-center gap-2"><Layers3 className="size-4 text-black/35" /><button className="lg:hidden" onClick={()=>setMobilePanel(null)} aria-label="Close structure panel"><X className="size-4"/></button></div>
          </div>
          <label className="mt-4 block text-xs font-medium">Page tree<select value={pageSlug} onChange={event=>location.href=`/builder?page=${encodeURIComponent(event.target.value)}`} className="mt-1 h-10 w-full rounded-lg border px-2">{pages.map(page=><option key={page.id} value={page.slug}>{page.title}</option>)}</select></label>
          <label className="mt-4 block text-xs font-medium">Layout template<select defaultValue="" onChange={event=>{if(event.target.value)applyTemplate(event.target.value as "product"|"collection"|"standard")}} className="mt-1 h-10 w-full rounded-lg border px-2"><option value="">Choose a template</option><option value="product">Product page</option><option value="collection">Collection page</option><option value="standard">Standard page</option></select><small className="mt-1 block text-black/40">Replacing a layout creates a recoverable backup.</small></label>
          <div className="mt-4 space-y-2">
            {sections.map((s, i) => {
              const registered = sectionRegistry[s.type];
              return (
                <div
                  key={s.id}
                  draggable
                  onDragStart={()=>setDragged(s.id)}
                  onDragOver={event=>event.preventDefault()}
                  onDrop={()=>{if(dragged)setDocument(value=>moveSection(value,dragged,s.id));setDragged("")}}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActive(s.id)}
                  onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setActive(s.id)}}}
                  className={`group flex w-full items-center gap-2 rounded-xl border p-3 text-left ${active === s.id ? "border-[#173a2b] bg-[#eff5f1]" : "border-black/8"}`}
                >
                  <GripVertical className="size-4 text-black/25" />
                  <span className="flex-1 text-sm font-medium">
                    {registered?.name || "Unavailable section"}
                  </span>
                  <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      type="button"
                      aria-label={`Move ${registered?.name||"section"} up`}
                      disabled={i===0}
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, -1);
                      }}
                      className="p-1 disabled:opacity-30"
                    >
                      <ChevronUp className="size-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${registered?.name||"section"} down`}
                      disabled={i===sections.length-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        move(i, 1);
                      }}
                      className="p-1 disabled:opacity-30"
                    >
                      <ChevronDown className="size-3" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
          {reusableSections(document).length?<><p className="mt-7 text-xs font-semibold uppercase tracking-wider text-black/35">Reusable & global</p><div className="mt-3 space-y-2">{reusableSections(document).map(item=><button key={item.id} onClick={()=>setDocument(value=>insertReusableSection(value,item.id))} className="flex w-full items-center gap-2 rounded-lg border border-dashed p-2.5 text-left text-xs"><Plus className="size-3"/>Insert {item.name}</button>)}</div></>:null}
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
                    setDocument(current=>insertSection(current,s as PageSection));
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
            className={`modulo-site tenant-theme mx-auto min-h-full overflow-hidden shadow-[0_20px_60px_rgba(30,35,28,.14)] transition-all ${device === "mobile" ? "max-w-[390px] rounded-[2rem] border-[7px] border-[#252723]" : device==="tablet"?"max-w-[768px] rounded-xl":"max-w-5xl rounded-xl"}`}
          >
            <div className="flex h-14 items-center justify-between border-b border-black/8 px-6">
              <strong className="text-sm">North & Pine</strong>
              <span className="text-xs text-black/45">
                Work&nbsp;&nbsp; Services&nbsp;&nbsp; Contact
              </span>
            </div>
            {sections.map((s) => {
              return (
                <div
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`cursor-pointer outline-offset-[-2px] ${active === s.id ? "outline-2 outline-[#3b7c5a]" : "hover:outline hover:outline-1 hover:outline-black/20"}`}
                >
                  <RegisteredSectionRenderer section={s} breakpoint={device} />
                </div>
              );
            })}
          </div>
        </section>
        <aside className={`${mobilePanel==="settings"?"fixed inset-0 z-50 block":"hidden"} overflow-y-auto border-l border-black/10 bg-white p-5 lg:static lg:block`}>
          <div className="mb-3 flex justify-end lg:hidden"><button onClick={()=>setMobilePanel(null)} aria-label="Close settings panel"><X className="size-4"/></button></div>
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
                    <ManifestField field={f} value={current.settings[f.key]} onChange={value=>update(f.key,value)}/>
                  </label>
                ))}
              </div>
              <BlockEditor
                section={current}
                definition={def}
                breakpoint={device}
                onChange={changeSection}
              />
              <div className="mt-6 space-y-3 border-t pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-black/35">Responsive design · {device}</p><div className="grid grid-cols-2 gap-2"><label className="text-xs">Visibility<select value={current.responsiveStyles?.[device]?.hidden?"hidden":"visible"} onChange={event=>updateAdvancedStyle({hidden:event.target.value==="hidden"})} className="mt-1 h-9 w-full rounded-lg border px-2"><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label><label className="text-xs">Layout<select value={String(current.responsiveStyles?.[device]?.layout||"block")} onChange={event=>updateAdvancedStyle({layout:event.target.value})} className="mt-1 h-9 w-full rounded-lg border px-2"><option value="block">Block</option><option value="flex">Flex</option><option value="grid">Grid</option></select></label>{[["paddingTop","Top spacing"],["paddingBottom","Bottom spacing"],["paddingInline","Side spacing"],["gap","Gap"],["fontSize","Font size"],["columns","Columns"]].map(([key,label])=><label key={key} className="text-xs">{label}<input type="number" min="0" max={key==="columns"?6:320} value={String(current.responsiveStyles?.[device]?.[key]||"")} onChange={event=>updateAdvancedStyle({[key]:Number(event.target.value)||undefined})} className="mt-1 h-9 w-full rounded-lg border px-2"/></label>)}</div><label className="block text-xs">Text alignment<select value={String(current.responsiveStyles?.[device]?.textAlign||"left")} onChange={event=>updateAdvancedStyle({textAlign:event.target.value})} className="mt-1 h-9 w-full rounded-lg border px-2"><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label></div>
              <div className="mt-8 flex gap-2 border-t pt-5">
                <Button onClick={()=>{setDocument(value=>duplicateSection(value,active));}} variant="outline" className="flex-1 rounded-xl">
                  <Copy className="size-4" />
                  Duplicate
                </Button>
                <Button
                  onClick={() => {
                    setDocument(value=>removeSection(value,active));
                    setActive(sections.find((s) => s.id !== active)?.id || "");
                  }}
                  variant="outline"
                  size="icon"
                  className="rounded-xl text-red-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Button onClick={saveReusable} variant="outline" className="mt-2 w-full rounded-xl">Save as reusable/global section</Button>
            </>
          ) : (
            <p className="text-sm text-black/40">
              Select a section to edit it.
            </p>
          )}
          <div className="mt-8 border-t pt-5"><label className="block text-xs font-semibold uppercase tracking-wider text-black/35">Controlled custom CSS<textarea defaultValue={String(document.globalTokens["advanced.customCss"]||"")} onBlur={event=>changeCss(event.target.value)} placeholder=".hero-title { letter-spacing: .04em; }" className="mt-3 min-h-28 w-full rounded-lg border p-3 font-mono text-xs"/></label><p className={`mt-2 text-xs ${cssError?"text-red-600":"text-black/40"}`}>{cssError||"Scoped to this site. Imports, URLs, scripts and global selectors are blocked."}</p></div>
        </aside>
      </div>
      <nav aria-label="Mobile editor tools" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-white p-2 lg:hidden"><button onClick={()=>setMobilePanel("structure")} className="flex flex-col items-center gap-1 text-xs"><Layers3 className="size-4"/>Structure</button><button onClick={()=>setMobilePanel("settings")} className="flex flex-col items-center gap-1 text-xs"><Palette className="size-4"/>Settings</button><button onClick={undo} disabled={!canUndo} className="flex flex-col items-center gap-1 text-xs disabled:opacity-30"><Undo2 className="size-4"/>Undo</button><button onClick={redo} disabled={!canRedo} className="flex flex-col items-center gap-1 text-xs disabled:opacity-30"><Redo2 className="size-4"/>Redo</button></nav>
    </main>
  );
}
