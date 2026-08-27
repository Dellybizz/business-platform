import type { BlockDefinition, BlockModule, SiteBlock } from "./types";
const modules=(import.meta as ImportMeta&{glob:(pattern:string,options:{eager:true})=>Record<string,unknown>}).glob("./blocks/*.tsx",{eager:true}) as Record<string,BlockModule>;
export const blockRegistry=Object.fromEntries(Object.values(modules).flatMap(module=>module.default?.presets?.length?[[module.default.type,module.default]]:[])) as Record<string,BlockDefinition>;
export function createBlock(type:string,presetIndex=0):SiteBlock{const definition=blockRegistry[type];if(!definition)throw new Error(`Unknown block type: ${type}`);const preset=definition.presets[presetIndex]||definition.presets[0];return{id:crypto.randomUUID(),type,settings:{...definition.defaults,...preset.settings}}}
export const blocksFor=(target?:"@theme"|string[])=>target==="@theme"?Object.values(blockRegistry):Array.isArray(target)?target.flatMap(type=>blockRegistry[type]?[blockRegistry[type]]:[]):[];
