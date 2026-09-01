import type { SectionDefinition, SectionModule, SiteSection } from "./types";
import { createBlock } from "./block-registry";

import{validateComponentManifest}from"./manifest-validation";
const modules=(import.meta as ImportMeta&{glob:(pattern:string[],options:{eager:true})=>Record<string,unknown>}).glob(["./sections/*.tsx","./sections/*/index.tsx"],{eager:true})as Record<string,SectionModule>;
export const sectionRegistry=Object.fromEntries(Object.entries(modules).map(([path,module])=>{const d=validateComponentManifest(module.default,path);return[d.type,d]}))as Record<string,SectionDefinition>;
export const availableSections=(mode?:string)=>Object.values(sectionRegistry).filter(section=>!section.enabledOn?.length||section.enabledOn.includes(mode as never));
const uniqueId=()=>globalThis.crypto?.randomUUID?.()||`section-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function createSection(type:string,presetIndex=0):SiteSection{const definition=sectionRegistry[type];if(!definition)throw new Error(`Unknown section type: ${type}`);const preset=definition.presets[presetIndex]||definition.presets[0];return{id:uniqueId(),type,version:definition.version,settings:{...definition.defaults,...preset.settings},blocks:preset.blocks?.map(item=>createBlock(item.type,item.preset||0))||[]}}
