import type { BlockDefinition, ComponentSettings } from "../types";
function ButtonBlock({settings}:{settings:ComponentSettings}){return <button className="rounded-full bg-black px-5 py-2.5 text-sm text-white">{settings.label}</button>}
const block:BlockDefinition={kind:"block",type:"button",name:"Button",version:1,presets:[{name:"Button"}],component:ButtonBlock,defaults:{label:"Learn more",link:"#"},fields:[{key:"label",label:"Button label",type:"text"},{key:"link",label:"Link",type:"text"}]};export default block;
