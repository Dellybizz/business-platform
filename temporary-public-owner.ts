export const TEMPORARY_PUBLIC_OWNER = {
  email: "public@business.zanisheluxe.in",
  fullName: "Public workspace",
  displayName: "Public workspace",
} as const;

// Phase 2 replaces this adapter with authenticated identity. Keeping the
// prototype owner here prevents public access logic leaking into workspace services.
export async function getTemporaryPublicOwner() {
  return TEMPORARY_PUBLIC_OWNER;
}
