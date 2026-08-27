import { WebsiteBuilder } from "@/components/platform/website-builder";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
export const dynamic="force-dynamic";
export default async function BuilderPage(){await requireChatGPTUser("/builder");return <WebsiteBuilder/>}
