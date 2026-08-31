import { WebsiteBuilder } from "@/components/platform/website-builder";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
export const dynamic="force-dynamic";
type Props={searchParams:Promise<{page?:string}>};
export default async function BuilderPage({searchParams}:Props){
  await requireChatGPTUser("/builder");
  const requested=(await searchParams).page||"home";
  const pageSlug=requested.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,80)||"home";
  return <WebsiteBuilder pageSlug={pageSlug}/>;
}
