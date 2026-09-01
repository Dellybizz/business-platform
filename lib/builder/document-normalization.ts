import type { SiteBlock } from "./types";
import { sectionRegistry } from "./registry";
import { blockRegistry } from "./block-registry";
import { normalizeSettings } from "./manifest-validation";
const normalizeBlock=(node:SiteBlock,depth=0):SiteBlock=>{if(depth>4)throw new Error("Component nesting exceeds four levels");const d=blockRegistry[node.type];return{...node,version:d?.version??node.version,settings:d?normalizeSettings(d,node.settings,node.version||1):node.settings,blocks:node.blocks?.map(child=>normalizeBlock(child,depth+1))||[]}};
export function normalizeRegisteredPageDocument<T extends{sections:SiteBlock[]}>(document:T):T{
  return {...document,sections:document.sections.map(section=>{const d=sectionRegistry[section.type];return{...section,version:d?.version??section.version,settings:d?normalizeSettings(d,section.settings,section.version||1):section.settings,blocks:section.blocks?.map(child=>normalizeBlock(child))||[]}})} as T;
}
