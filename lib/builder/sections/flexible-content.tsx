import type { ComponentSettings, SectionDefinition, SiteBlock } from "../types";
import { RegisteredBlockRenderer } from "../registered-renderer";

function FlexibleContent({ settings, blocks = [] }: { settings: ComponentSettings; blocks?: SiteBlock[] }) {
  return <section className="px-7 py-12" style={{ background: String(settings.background || "") }}><div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">{blocks.map((block) => <RegisteredBlockRenderer key={block.id} block={block} />)}</div></section>;
}

const section: SectionDefinition = {
  kind:"section",type:"flexible-content",name:"Flexible content",category:"Essentials",description:"Build a layout from reusable theme blocks.",version:1,
  presets: [{ name: "Flexible content", blocks: [{ type: "text" }, { type: "button" }] }], blocks: "@theme", maxBlocks: 12, component: FlexibleContent,
  defaults: { background: "#ffffff" }, fields: [{ key: "background", label: "Background", type: "color" }],
};
export default section;
