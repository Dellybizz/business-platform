import type { WebsiteDatabase } from "./service";

async function ownedSite(db: WebsiteDatabase, workspaceId: string) {
  const site = await db.prepare("SELECT id FROM sites WHERE workspace_id=? AND status='active'").bind(workspaceId).first<{id:string}>();
  if (!site) throw new Response("Site not found", { status: 404 });
  return site.id;
}

const cleanHostname = (value:string) => value.trim().toLowerCase().replace(/^https?:\/\//,"").split("/")[0].split(":")[0];

export async function listDomains(db:WebsiteDatabase,workspaceId:string){
  const siteId=await ownedSite(db,workspaceId);
  return (await db.prepare("SELECT id,hostname,status,verified_at AS verifiedAt,created_at AS createdAt FROM custom_domains WHERE site_id=? ORDER BY created_at DESC").bind(siteId).all()).results;
}

export async function registerDomain(db:WebsiteDatabase,input:{workspaceId:string;hostname:string}){
  const siteId=await ownedSite(db,input.workspaceId),hostname=cleanHostname(input.hostname);
  if(!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname))throw new Error("Enter a valid hostname");
  const id=crypto.randomUUID(),now=Date.now();
  await db.prepare("INSERT INTO custom_domains (id,workspace_id,site_id,hostname,status,created_at) VALUES (?,?,?,?,'pending',?)").bind(id,input.workspaceId,siteId,hostname,now).run();
  return{id,hostname,status:"pending",createdAt:now};
}

export async function removeDomain(db:WebsiteDatabase,workspaceId:string,domainId:string){
  const siteId=await ownedSite(db,workspaceId);
  const result=await db.prepare("DELETE FROM custom_domains WHERE id=? AND site_id=?").bind(domainId,siteId).run();
  if(!result.meta.changes)throw new Response("Domain not found",{status:404});
  return{deleted:true};
}

export async function listAssets(db:WebsiteDatabase,workspaceId:string){
  const siteId=await ownedSite(db,workspaceId);
  return (await db.prepare("SELECT id,storage_key AS storageKey,mime_type AS mimeType,alt_text AS altText,created_at AS createdAt FROM site_assets WHERE site_id=? ORDER BY created_at DESC").bind(siteId).all()).results;
}

export async function createAsset(db:WebsiteDatabase,input:{workspaceId:string;storageKey:string;mimeType:string;altText?:string}){
  const siteId=await ownedSite(db,input.workspaceId),storageKey=input.storageKey.trim(),mimeType=input.mimeType.trim().toLowerCase();
  if(!/^[a-zA-Z0-9/_\-.]{1,500}$/.test(storageKey)||storageKey.includes(".."))throw new Error("Invalid asset storage key");
  if(!/^(image|video|application)\/[a-z0-9.+-]{1,100}$/.test(mimeType))throw new Error("Invalid asset MIME type");
  const id=crypto.randomUUID(),createdAt=Date.now(),altText=(input.altText||"").trim().slice(0,500);
  await db.prepare("INSERT INTO site_assets (id,site_id,storage_key,mime_type,alt_text,created_at) VALUES (?,?,?,?,?,?)").bind(id,siteId,storageKey,mimeType,altText,createdAt).run();
  return{id,storageKey,mimeType,altText,createdAt};
}

export async function removeAsset(db:WebsiteDatabase,workspaceId:string,assetId:string){
  const siteId=await ownedSite(db,workspaceId);
  const inUse=await db.prepare("SELECT 1 AS used FROM pages WHERE site_id=? AND social_image_asset_id=? AND deleted_at IS NULL LIMIT 1").bind(siteId,assetId).first();
  if(inUse)throw new Response("Asset is used by page SEO and cannot be deleted",{status:409});
  const result=await db.prepare("DELETE FROM site_assets WHERE id=? AND site_id=?").bind(assetId,siteId).run();
  if(!result.meta.changes)throw new Response("Asset not found",{status:404});
  return{deleted:true};
}
