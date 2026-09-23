import type { CSSProperties } from "react";
import type { PageBlock, PageDocument, PageSection, ResponsiveStyles } from "@/src/website/page-document";

export const editorBreakpoints = ["desktop", "tablet", "mobile"] as const;
export type EditorBreakpoint = (typeof editorBreakpoints)[number];

export type AdvancedStyleValues = {
  hidden?: boolean;
  paddingTop?: number;
  paddingBottom?: number;
  paddingInline?: number;
  gap?: number;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
  layout?: "block" | "flex" | "grid";
  columns?: number;
};

const numericKeys = new Set(["paddingTop", "paddingBottom", "paddingInline", "gap", "fontSize", "columns"]);
const allowedKeys = new Set(["hidden", ...numericKeys, "textAlign", "layout"]);

export function updateResponsiveStyles(node: PageBlock, breakpoint: EditorBreakpoint, patch: AdvancedStyleValues): PageBlock {
  const current = node.responsiveStyles?.[breakpoint] || {};
  const next = Object.fromEntries(
    Object.entries({ ...current, ...patch }).filter(([key, value]) => allowedKeys.has(key) && value !== undefined),
  );
  return { ...node, responsiveStyles: { ...(node.responsiveStyles || {}), [breakpoint]: next } };
}

export function responsiveInlineStyle(styles: ResponsiveStyles | undefined, breakpoint: EditorBreakpoint): CSSProperties {
  const value = styles?.[breakpoint] || {};
  return {
    display: value.hidden ? "none" : value.layout === "flex" ? "flex" : value.layout === "grid" ? "grid" : undefined,
    paddingTop: numberValue(value.paddingTop),
    paddingBottom: numberValue(value.paddingBottom),
    paddingInline: numberValue(value.paddingInline),
    gap: numberValue(value.gap),
    fontSize: numberValue(value.fontSize),
    textAlign: value.textAlign === "center" || value.textAlign === "right" ? value.textAlign : value.textAlign === "left" ? "left" : undefined,
    gridTemplateColumns: value.layout === "grid" && Number(value.columns) > 0 ? `repeat(${Math.min(6, Number(value.columns))}, minmax(0, 1fr))` : undefined,
  };
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(number, 320) : undefined;
}

export function moveSection(document: PageDocument, draggedId: string, targetId: string): PageDocument {
  if (draggedId === targetId) return document;
  const from = document.sections.findIndex((section) => section.id === draggedId);
  const to = document.sections.findIndex((section) => section.id === targetId);
  if (from < 0 || to < 0) return document;
  const sections = [...document.sections];
  const [moved] = sections.splice(from, 1);
  sections.splice(to, 0, moved);
  return { ...document, sections };
}

export function moveBlock(section: PageSection, draggedId: string, targetId: string): PageSection {
  if (draggedId === targetId) return section;
  const blocks = [...section.blocks];
  const from = blocks.findIndex((block) => block.id === draggedId);
  const to = blocks.findIndex((block) => block.id === targetId);
  if (from < 0 || to < 0) return section;
  const [moved] = blocks.splice(from, 1);
  blocks.splice(to, 0, moved);
  return { ...section, blocks };
}

const reusableToken = "advanced.reusableSections";
type ReusableSection = { id: string; name: string; section: PageSection };

export function reusableSections(document: PageDocument): ReusableSection[] {
  try {
    const value = JSON.parse(String(document.globalTokens[reusableToken] || "[]"));
    return Array.isArray(value) ? value.filter((entry) => entry?.id && entry?.name && entry?.section) : [];
  } catch {
    return [];
  }
}

export function saveReusableSection(document: PageDocument, sectionId: string, name: string): PageDocument {
  const section = document.sections.find((entry) => entry.id === sectionId);
  if (!section || !name.trim()) return document;
  const key = String(section.settings.__globalKey || crypto.randomUUID());
  const globalSection = { ...section, settings: { ...section.settings, __globalKey: key } };
  const existing = reusableSections(document).filter((entry) => entry.id !== key);
  const library = [...existing, { id: key, name: name.trim().slice(0, 80), section: globalSection }];
  return {
    ...document,
    globalTokens: { ...document.globalTokens, [reusableToken]: JSON.stringify(library) },
    sections: document.sections.map((entry) => entry.id === sectionId ? globalSection : entry),
  };
}

export function insertReusableSection(document: PageDocument, reusableId: string): PageDocument {
  const item = reusableSections(document).find((entry) => entry.id === reusableId);
  if (!item) return document;
  const clone = cloneNode(item.section) as PageSection;
  clone.settings = { ...clone.settings, __globalKey: reusableId };
  return { ...document, sections: [...document.sections, clone] };
}

export function synchronizeGlobalSection(document: PageDocument, changed: PageSection): PageDocument {
  const key = String(changed.settings.__globalKey || "");
  if (!key) return { ...document, sections: document.sections.map((entry) => entry.id === changed.id ? changed : entry) };
  const library = reusableSections(document).map((entry) => entry.id === key ? { ...entry, section: { ...changed, id: entry.section.id } } : entry);
  return {
    ...document,
    globalTokens: { ...document.globalTokens, [reusableToken]: JSON.stringify(library) },
    sections: document.sections.map((entry) => entry.settings.__globalKey === key ? { ...cloneNode(changed), id: entry.id } as PageSection : entry),
  };
}

function cloneNode(node: PageBlock): PageBlock {
  return { ...node, id: crypto.randomUUID(), settings: { ...node.settings }, responsiveStyles: node.responsiveStyles ? structuredClone(node.responsiveStyles) : undefined, blocks: node.blocks?.map(cloneNode) };
}

export function sanitizeCustomCss(input: string): string {
  const css = input.replace(/\/\*[\s\S]*?\*\//g, "").trim().slice(0, 12000);
  if (!css) return "";
  if (/@(?:import|charset|namespace)|expression\s*\(|javascript\s*:|behavior\s*:|url\s*\(/i.test(css)) throw new Error("Custom CSS contains an unsupported or unsafe rule");
  if (/[<>]/.test(css)) throw new Error("Custom CSS contains unsupported markup");
  const output: string[] = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = rule.exec(css))) {
    const selectors = match[1].split(",").map((selector) => selector.trim()).filter(Boolean);
    if (!selectors.length || selectors.some((selector) => selector.startsWith("@") || /(?:html|body|:root)(?:\b|\s|[.:#[])/i.test(selector))) throw new Error("Custom CSS must target site content only");
    const declarations = match[2].split(";").map((item) => item.trim()).filter(Boolean).filter((item) => /^--[a-z0-9_-]+\s*:/i.test(item) || /^(?:color|background(?:-color)?|border(?:-[a-z]+)?|border-radius|box-shadow|font(?:-size|-weight|-family)?|line-height|letter-spacing|text-align|text-transform|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|display|grid-template-columns|align-items|justify-content|opacity|max-width|min-height)\s*:/i.test(item));
    if (!declarations.length) continue;
    output.push(`${selectors.map((selector) => selector.startsWith(".modulo-site ") ? selector : `.modulo-site ${selector}`).join(", ")} { ${declarations.join("; ")}; }`);
  }
  if (!output.length) throw new Error("Custom CSS did not contain any supported rules");
  return output.join("\n");
}

export function editorTemplate(kind: "product" | "collection" | "standard", create: (type: string) => PageSection): PageSection[] {
  if (kind === "product") return [create("hero"), create("product-showcase"), create("features"), create("callout")];
  if (kind === "collection") return [create("hero"), create("product-showcase"), create("flexible-content")];
  return [create("hero"), create("flexible-content"), create("callout")];
}

export function responsiveStyleSheet(sections: PageSection[]): string {
  const rules: string[] = [];
  const walk = (node: PageBlock) => {
    const selector = `.modulo-site [data-component-id="${node.id.replace(/[^a-zA-Z0-9_-]/g, "")}"]`;
    for (const [breakpoint, value] of Object.entries(node.responsiveStyles || {})) {
      const declarations = styleDeclarations(value);
      if (!declarations) continue;
      if (breakpoint === "desktop") rules.push(`${selector}{${declarations}}`);
      else if (breakpoint === "tablet") rules.push(`@media (max-width: 1023px){${selector}{${declarations}}}`);
      else if (breakpoint === "mobile") rules.push(`@media (max-width: 639px){${selector}{${declarations}}}`);
    }
    node.blocks?.forEach(walk);
  };
  sections.forEach(walk);
  return rules.join("\n");
}

function styleDeclarations(value: Record<string, unknown>): string {
  const output: string[] = [];
  if (value.hidden === true) output.push("display:none!important");
  else if (value.layout === "flex") output.push("display:flex");
  else if (value.layout === "grid") output.push("display:grid");
  for (const [key, property] of [["paddingTop", "padding-top"], ["paddingBottom", "padding-bottom"], ["paddingInline", "padding-inline"], ["gap", "gap"], ["fontSize", "font-size"]] as const) { const number = numberValue(value[key]); if (number !== undefined) output.push(`${property}:${number}px`); }
  if (value.textAlign === "left" || value.textAlign === "center" || value.textAlign === "right") output.push(`text-align:${value.textAlign}`);
  if (value.layout === "grid" && Number(value.columns) > 0) output.push(`grid-template-columns:repeat(${Math.min(6, Number(value.columns))},minmax(0,1fr))`);
  return output.join(";");
}
