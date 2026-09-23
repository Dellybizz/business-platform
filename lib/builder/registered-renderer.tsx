"use client";
import type { SiteBlock, SiteSection } from "./types";
import { sectionRegistry } from "./registry";
import { blockRegistry } from "./block-registry";
import { globalRegistry } from "./global-registry";
import { normalizeSettings } from "./manifest-validation";
import { ComponentErrorBoundary } from "./component-error-boundary";
import { responsiveInlineStyle, type EditorBreakpoint } from "@/lib/editor/advanced-editor";

export function RegisteredSectionRenderer({ section, breakpoint }: { section: SiteSection; breakpoint?: EditorBreakpoint }) {
  const definition = sectionRegistry[section.type];
  if (!definition) return <div data-unavailable-component={section.type}>Unavailable component: {section.type}</div>;
  const Component = definition.component;
  return <div data-component-id={section.id} data-component-type={section.type} style={breakpoint?responsiveInlineStyle(section.responsiveStyles, breakpoint):undefined}><ComponentErrorBoundary type={section.type}><Component settings={normalizeSettings(definition, section.settings, section.version || 1)} blocks={section.blocks} /></ComponentErrorBoundary></div>;
}

export function RegisteredBlockRenderer({ block, breakpoint }: { block: SiteBlock; breakpoint?: EditorBreakpoint }) {
  const definition = blockRegistry[block.type];
  if (!definition) return <div data-unavailable-component={block.type}>Unavailable block: {block.type}</div>;
  const Component = definition.component;
  return <div data-component-id={block.id} data-component-type={block.type} style={breakpoint?responsiveInlineStyle(block.responsiveStyles, breakpoint):undefined}><ComponentErrorBoundary type={block.type}><Component settings={normalizeSettings(definition, block.settings, block.version || 1)} blocks={block.blocks} /></ComponentErrorBoundary></div>;
}

export function RegisteredGlobals({ slot }: { slot: "before" | "after" }) {
  return <>{Object.values(globalRegistry).filter((definition) => definition.slot === slot).map((definition) => { const Component = definition.component; return <ComponentErrorBoundary key={definition.type} type={definition.type}><Component settings={definition.defaults} /></ComponentErrorBoundary>; })}</>;
}
