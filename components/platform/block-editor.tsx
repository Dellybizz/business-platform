"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { blockRegistry, blocksFor, createBlock } from "@/lib/builder/block-registry";
import type { SectionDefinition, SiteSection } from "@/lib/builder/types";
import { moveBlock, updateResponsiveStyles, type EditorBreakpoint } from "@/lib/editor/advanced-editor";

export function BlockEditor({ section, definition, onChange, breakpoint }: { section: SiteSection; definition: SectionDefinition; onChange: (section: SiteSection) => void; breakpoint: EditorBreakpoint }) {
  const [selected, setSelected] = useState(section.blocks?.[0]?.id || ""), [dragged, setDragged] = useState("");
  if (!definition.blocks) return null;
  const blocks = section.blocks || [], selectedId=blocks.some((block)=>block.id===selected)?selected:blocks[0]?.id||"", current = blocks.find((block) => block.id === selectedId), currentDefinition = current ? blockRegistry[current.type] : null;
  const update = (key: string, value: string) => onChange({ ...section, blocks: blocks.map((block) => block.id === selectedId ? { ...block, settings: { ...block.settings, [key]: value } } : block) });
  const move = (index: number, step: number) => { const target = index + step; if (target >= 0 && target < blocks.length) onChange(moveBlock(section as import("@/src/website/page-document").PageSection, blocks[index].id, blocks[target].id) as SiteSection); };
  const style = current?.responsiveStyles?.[breakpoint] || {};
  const updateStyle = (values: Record<string, string | number | boolean | undefined>) => current && onChange({ ...section, blocks: blocks.map((block) => block.id === current.id ? updateResponsiveStyles(block as import("@/src/website/page-document").PageBlock, breakpoint, values) : block) });
  return <div className="mt-8 border-t pt-5"><p className="text-xs font-semibold uppercase tracking-wider text-black/35">Blocks</p>
    <div className="mt-3 space-y-2">{blocks.map((block, index) => <div key={block.id} draggable onDragStart={() => setDragged(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged) onChange(moveBlock(section as import("@/src/website/page-document").PageSection, dragged, block.id) as SiteSection); setDragged(""); }} className={`flex w-full items-center gap-1 rounded-lg border p-2 text-sm ${selectedId === block.id ? "border-black/40 bg-black/[.03]" : "border-black/10"}`}>
      <GripVertical className="size-3 cursor-grab text-black/30" aria-hidden="true" /><button type="button" onClick={() => setSelected(block.id)} className="flex-1 text-left">{blockRegistry[block.type]?.name || "Unavailable block"}</button>
      <button type="button" aria-label={`Move ${blockRegistry[block.type]?.name || "block"} up`} disabled={index === 0} onClick={() => move(index, -1)} className="p-1 disabled:opacity-25"><ChevronUp className="size-3" /></button>
      <button type="button" aria-label={`Move ${blockRegistry[block.type]?.name || "block"} down`} disabled={index === blocks.length - 1} onClick={() => move(index, 1)} className="p-1 disabled:opacity-25"><ChevronDown className="size-3" /></button>
      <button type="button" aria-label={`Remove ${blockRegistry[block.type]?.name || "block"}`} onClick={() => { onChange({ ...section, blocks: blocks.filter((entry) => entry.id !== block.id) }); setSelected(""); }} className="p-1"><Trash2 className="size-3 text-red-500" /></button>
    </div>)}</div>
    {current && currentDefinition ? <div className="mt-4 space-y-4 rounded-lg bg-black/[.025] p-3">{currentDefinition.fields.map((field) => <label key={field.key} className="block"><span className="mb-1.5 block text-xs font-medium">{field.label}</span>{field.type === "textarea" ? <Textarea value={String(current.settings[field.key] || "")} onChange={(event) => update(field.key, event.target.value)} /> : <Input value={String(current.settings[field.key] || "")} onChange={(event) => update(field.key, event.target.value)} />}</label>)}
      <div className="grid grid-cols-2 gap-2 border-t pt-3"><label className="text-xs"><span className="mb-1 block">Visibility</span><select value={style.hidden ? "hidden" : "visible"} onChange={(event) => updateStyle({ hidden: event.target.value === "hidden" })} className="h-9 w-full rounded-lg border px-2"><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label><label className="text-xs"><span className="mb-1 block">Font size</span><Input type="number" min="0" max="120" value={String(style.fontSize || "")} onChange={(event) => updateStyle({ fontSize: Number(event.target.value) || undefined })} /></label></div>
    </div> : null}
    <div className="mt-4 space-y-2">{blocksFor(definition.blocks).flatMap((block) => block.presets.map((preset, index) => <button type="button" disabled={blocks.length >= (definition.maxBlocks || 50)} key={`${block.type}-${preset.name}`} onClick={() => { const created = createBlock(block.type, index); onChange({ ...section, blocks: [...blocks, created] }); setSelected(created.id); }} className="flex w-full items-center gap-2 rounded-lg border border-dashed p-2.5 text-left text-xs disabled:opacity-40"><Plus className="size-3" />Add {preset.name}</button>))}</div>
  </div>;
}
