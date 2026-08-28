import { isWorkspaceType, workspacePresets, type WorkspaceType } from "./model";

export type WorkspaceOnboardingInput = {
  name?: unknown;
  slug?: unknown;
  type?: unknown;
  businessCategory?: unknown;
  requestId?: unknown;
};

export type ValidWorkspaceOnboarding = {
  name: string;
  slug: string;
  type: WorkspaceType;
  businessCategory: string | null;
  requestId: string | null;
};

export class OnboardingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnboardingValidationError";
  }
}

export function normalizeWorkspaceSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function validateWorkspaceOnboarding(input: WorkspaceOnboardingInput): ValidWorkspaceOnboarding {
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 100) : "";
  if (!name) throw new OnboardingValidationError("Workspace or site name is required");
  if (!isWorkspaceType(input.type)) throw new OnboardingValidationError("Choose a valid workspace type");

  const requestedSlug = typeof input.slug === "string" ? input.slug : name;
  const slug = normalizeWorkspaceSlug(requestedSlug);
  if (slug.length < 3) throw new OnboardingValidationError("Preferred slug must contain at least 3 letters or numbers");

  const category = typeof input.businessCategory === "string"
    ? input.businessCategory.trim().slice(0, 80)
    : "";
  if (workspacePresets[input.type].requiresBusinessCategory && !category) {
    throw new OnboardingValidationError("Business category is required for this workspace type");
  }

  const requestId = typeof input.requestId === "string"
    ? input.requestId.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || null
    : null;

  return { name, slug, type: input.type, businessCategory: category || null, requestId };
}

export function onboardingKey(userId: string, input: ValidWorkspaceOnboarding) {
  return `${userId}:${input.requestId ?? `${input.type}:${input.slug}`}`;
}
