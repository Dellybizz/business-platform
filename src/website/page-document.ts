export const PAGE_DOCUMENT_SCHEMA_VERSION = 1 as const;

export const pageTypes = [
  "home", "standard", "product", "collection", "service",
  "portfolio_project", "article", "contact",
] as const;
export type PageType = (typeof pageTypes)[number];

export type PageBlock = {
  id: string;
  type: string;
  settings: Record<string, string | number | boolean | null>;
};

export type PageSection = PageBlock & { blocks: PageBlock[] };
export type PageDocument = {
  schemaVersion: typeof PAGE_DOCUMENT_SCHEMA_VERSION;
  sections: PageSection[];
};

export class PageDocumentValidationError extends Error {}

const scalar = (value: unknown): value is string | number | boolean | null =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

function record(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PageDocumentValidationError(`${label} must be an object`);
  }
  const entries = Object.entries(value);
  if (entries.length > 100 || entries.some(([key, item]) => !key || key.length > 80 || !scalar(item))) {
    throw new PageDocumentValidationError(`${label} contains unsupported settings`);
  }
  return Object.fromEntries(entries) as Record<string, string | number | boolean | null>;
}

function node(value: unknown, label: string): PageBlock {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PageDocumentValidationError(`${label} must be an object`);
  }
  const input = value as Record<string, unknown>;
  if (typeof input.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.id)) {
    throw new PageDocumentValidationError(`${label} has an invalid id`);
  }
  if (typeof input.type !== "string" || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(input.type)) {
    throw new PageDocumentValidationError(`${label} has an invalid component type`);
  }
  return { id: input.id, type: input.type, settings: record(input.settings ?? {}, `${label}.settings`) };
}

export function validatePageDocument(value: unknown): PageDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PageDocumentValidationError("Page document must be an object");
  }
  const input = value as Record<string, unknown>;
  if (input.schemaVersion !== PAGE_DOCUMENT_SCHEMA_VERSION) {
    throw new PageDocumentValidationError(`Unsupported page document schema version: ${String(input.schemaVersion)}`);
  }
  if (!Array.isArray(input.sections) || input.sections.length > 100) {
    throw new PageDocumentValidationError("Page document sections must be an array of at most 100 items");
  }
  const ids = new Set<string>();
  const sections = input.sections.map((item, index) => {
    const section = node(item, `sections[${index}]`);
    const rawBlocks = (item as Record<string, unknown>).blocks ?? [];
    if (!Array.isArray(rawBlocks) || rawBlocks.length > 100) {
      throw new PageDocumentValidationError(`sections[${index}].blocks must be an array of at most 100 items`);
    }
    const blocks = rawBlocks.map((block, blockIndex) => node(block, `sections[${index}].blocks[${blockIndex}]`));
    for (const entry of [section, ...blocks]) {
      if (ids.has(entry.id)) throw new PageDocumentValidationError(`Duplicate component id: ${entry.id}`);
      ids.add(entry.id);
    }
    return { ...section, blocks };
  });
  return { schemaVersion: PAGE_DOCUMENT_SCHEMA_VERSION, sections };
}

export function documentFromLegacySections(sections: unknown): PageDocument {
  return validatePageDocument({ schemaVersion: PAGE_DOCUMENT_SCHEMA_VERSION, sections });
}

export function parsePageDocument(json: string): PageDocument {
  try { return validatePageDocument(JSON.parse(json)); }
  catch (error) {
    if (error instanceof PageDocumentValidationError) throw error;
    throw new PageDocumentValidationError("Page document is not valid JSON");
  }
}
