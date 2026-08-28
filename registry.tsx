import type { SectionDefinition, SectionModule, SiteSection } from "./types";
import { createBlock } from "./block-registry";

const modules=(import.meta as ImportMeta & {glob:(pattern:string,options:{eager:true})=>Record<string,unknown>}).glob("./sections/*.tsx",{eager:true}) as Record<string,SectionModule>;
function validate(definition:SectionDefinition,path:string){if(!definition?.type||!definition.name||!definition.component)throw new Error(`Invalid section module: ${path}`);if(!definition.presets?.length)return null;return definition}
export const sectionRegistry=Object.fromEntries(Object.entries(modules).flatMap(([path,module])=>{const definition=validate(module.default,path);return definition?[[definition.type,definition]]:[]})) as Record<string,SectionDefinition>;
export const availableSections=(capabilities:string[]=[])=>Object.values(sectionRegistry).filter(section=>!section.requiredCapabilities?.length||section.requiredCapabilities.every(capability=>capabilities.includes(capability)));
export function createSection(type:string,presetIndex=0):SiteSection{const definition=sectionRegistry[type];if(!definition)throw new Error(`Unknown section type: ${type}`);const preset=definition.presets[presetIndex]||definition.presets[0];return{id:crypto.randomUUID(),type,settings:{...definition.defaults,...preset.settings},blocks:preset.blocks?.map(item=>createBlock(item.type,item.preset||0))}}
