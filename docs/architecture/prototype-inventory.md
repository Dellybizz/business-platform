# Prototype inventory: reuse, migrate or replace

**Audit date:** 2026-08-28  
**Prototype commit:** `3c267e8` plus uncommitted user UI work

## Classification rules

- **Reuse:** technically compatible with the target boundary; move or wrap it without preserving its current location.
- **Migrate:** data or behaviour is valuable, but its schema/API must change.
- **Replace:** conflicts with the target architecture or is only demonstration UI.
- **Retain temporarily:** needed to keep the deployed prototype available until its replacement vertical slice is verified.

## Routes and application surfaces

| Current area | Classification | Target owner | Notes / removal condition |
|---|---|---|---|
| `app/page.tsx` | Replace | `src/apps/marketing-site` | Three hardcoded modes become four capability presets in Phase 1. Retain until onboarding replacement works. |
| `app/dashboard/page.tsx` | Replace | `src/apps/merchant-admin` | Route is a thin shell, but current dashboard data and navigation are prototype-specific. |
| `app/site/page.tsx` | Migrate | Merchant Admin / Online Store channel | Useful overview concept; move behind channel/capability navigation. |
| `app/pages/page.tsx` | Migrate | Merchant Admin / Website | Preserve page-management behaviour while adopting versioned site/page services. |
| `app/builder/page.tsx` | Replace | `src/apps/visual-editor` | Dedicated surface is correct; current editor data contract is not. |
| `app/themes/page.tsx` | Migrate | Merchant Admin / Theme Engine | Preserve useful visual ideas, replace static registry and activation model. |
| `app/businesses/page.tsx` | Replace | Merchant Admin workspace switcher | Current screen is not the platform-owner workspace administration. |
| `app/content/page.tsx` | Replace | Content or Commerce domain | Generic content manager cannot represent normalized products/services/projects. |
| `app/inbox/page.tsx` | Migrate | Leads/forms domain | Existing submissions can migrate to forms, contacts and enquiries. |
| `app/settings/page.tsx` | Migrate | Merchant Admin | Split into capability-aware settings sections backed by services. |
| `app/s/[slug]/page.tsx` and `app/s/[slug]/[page]/page.tsx` | Migrate | `src/apps/storefront` | Preserve public route shape temporarily; replace data lookup with domain/site resolver. |
| `app/api/workspace/route.ts` | Replace | Workspace and Site services | Handler currently combines identity, workspace, page, summary and mutation responsibilities. |
| `app/api/pages/route.ts` | Replace | Page Service | Preserve page records through migration, replace direct SQL and slug strategy. |
| `app/api/items/route.ts` | Replace | Catalog/Content services | Generic items table is temporary. |
| `app/api/submissions/route.ts` | Migrate | Forms/Leads services | Existing records are valuable; direct SQL API is replaced. |
| `app/api/public/[slug]/route.ts` | Replace | Storefront resolver | Must enforce published versions and domain/site resolution. |

## UI and builder code

| Current area | Classification | Target owner | Notes |
|---|---|---|---|
| `components/ui/*` | Reuse selectively | `src/shared/ui` | Mature primitives are reusable after accessibility and bundle review. |
| `components/platform/admin-shell.tsx` | Replace | Merchant Admin | Hardcoded navigation cannot support capabilities or plugin targets. |
| `components/platform/dashboard.tsx` | Replace | Merchant Admin | Keep design references only; future cards use real service data. |
| `components/platform/website-overview.tsx` | Migrate | Online Store channel | Untracked user work; preserve while moving to the correct boundary. |
| `components/platform/pages-manager.tsx` | Migrate | Website | Page-management interactions can inform the replacement. |
| `components/platform/website-builder.tsx` | Replace | Visual Editor | Current editor can inform UX but must use page versions and manifest settings. |
| `components/platform/block-editor.tsx` | Replace | Visual Editor | Replace with manifest-generated editing controls. |
| `components/platform/public-site.tsx` | Migrate | Storefront renderer | Preserve useful presentational elements, replace data contract. |
| `components/platform/customer-site.tsx` | Replace | Storefront/portals | Responsibility is ambiguous and must be separated. |
| Remaining `components/platform/*` | Migrate selectively | Respective application/domain | Preserve user styling where useful; remove coupled data assumptions. |
| `lib/builder/registry.tsx` | Migrate | Component registry | Automatic `import.meta.glob` discovery is a useful proof; replace flat file/schema contract with packaged manifests and versions. |
| `lib/builder/block-registry.tsx` | Migrate | Component registry | Same as section registry. |
| `lib/builder/sections/*` | Migrate selectively | `src/components/sections` | Convert useful sections into package folders with manifests, thumbnails and migrations. |
| `lib/themes/registry.ts` | Replace | Theme Engine | Static in-file registry cannot support versions, installations, preview or rollback. |
| `lib/auth/tenant.ts` | Replace | Core identity/workspaces | Cookie selection concept is reusable; ChatGPT identity coupling, legacy claim and direct SQL are not. |

## Database and data

| Current table/data | Classification | Migration destination |
|---|---|---|
| `users` | Migrate | New identity schema; retain stable identity mapping where possible. |
| `workspaces` | Migrate | Workspace plus capabilities; translate `mode` to a capability preset. |
| `memberships` | Migrate | Workspace memberships and roles. |
| `custom_domains` | Migrate | Sites/domains with verification and routing state. |
| `pages` | Migrate | Sites, pages and initial draft/published page versions. |
| `content_items` | Migrate then remove | Products, services or portfolio entries based on validated `kind`; quarantine unknown kinds. |
| `submissions` | Migrate | Forms, submissions and contacts. |
| Drizzle migrations `0000`–`0005` | Retain as history | Never rewrite applied migrations; start replacement migrations after a documented baseline. |
| `database-setup.sql` | Replace after review | Deployment bootstrap must use the canonical migration chain. |

## Infrastructure and tooling

| Current area | Classification | Notes |
|---|---|---|
| Cloudflare Worker + Vinext entry | Reuse | Compatible with the target modular monolith; keep adapter thin. |
| D1 binding `DB` | Reuse | Remains the relational store; schema will migrate. |
| Optional hosting configuration fallback | Reuse temporarily | Required for current external Cloudflare builds; document environment contract. |
| R2 | Add later | Introduce binding when the asset domain is implemented; do not emulate durable uploads on local filesystem. |
| `scripts/sites-env.sh` | Reuse | Provides isolated, reproducible local/CI paths. |
| `scripts/build-verified.sh` | Reuse | Bounded production build is useful. |
| `scripts/install-ci.sh` | Reuse | Safe install helper; deployment docs must also explain standard `npm ci`. |
| Existing rendered/UI tests | Reuse | They validate toolchain/UI primitives but do not cover platform architecture. |
| Generated `dist/`, `.wrangler/`, `node_modules/` | Replaceable generated state | Never treat as source or commit as architecture work. |

## Required prototype flows before removal

| Flow | Current entry | Replacement owner | Delete old flow after |
|---|---|---|---|
| Landing/onboarding | `/` | Marketing Site | Four-type onboarding creates a valid workspace idempotently. |
| Dashboard | `/dashboard` | Merchant Admin | Capability-aware dashboard works for all workspace presets. |
| Website overview | `/site` | Online Store/Website | New channel overview loads real site state. |
| Page manager | `/pages` | Website | Draft/publish page service passes migration tests. |
| Editor | `/builder` | Visual Editor | Auto-registered section can save, preview and publish. |
| Themes | `/themes` | Theme Engine | Versioned preview/activation works. |
| Public site | `/s/{slug}` | Storefront | Published version resolves by slug and domain. |
