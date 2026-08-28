# Modular Business Platform — Master Implementation Plan

**Product direction:** Shopify-style shared commerce architecture with WordPress-style modularity.

**Primary service families:**

1. **Commerce Business** — Online Store and POS are two sales channels over one shared catalog, inventory, customer and order system.
2. **Business Website** — Service/showcase websites focused on leads, enquiries, bookings and content.
3. **CV & Portfolio** — Lightweight personal sites, with a free plan and optional upgrades.

**Infrastructure target:** Cloudflare Workers, D1 and R2, implemented initially as a modular monolith to keep operating cost and maintenance low.

---

## How to use this plan

- Complete phases in order unless a phase explicitly says it can run in parallel.
- Each phase ends with a **definition of done**. Do not start the next dependent phase until those checks pass.
- Give Codex the instruction shown under **Next instruction to give Codex**.
- The current project is a prototype, not an architectural constraint. Replace existing files, routes, components and database structures whenever they conflict with this plan.
- Reuse an existing implementation only when it fits the target boundaries and passes the new tests.
- Build the replacement through verified vertical slices so the deployed prototype can remain available until its replacement flow works.
- Update the status table after every completed batch.

### Status values

- `Not started`
- `In progress`
- `Blocked`
- `Complete`

## Progress tracker

| Phase | Name | Status | Depends on |
|---:|---|---|---|
| 0 | Clean foundation and controlled reset | Complete | — |
| 1 | Product model and workspace onboarding | Complete | 0 |
| 2 | Multi-tenant identity and permissions | Not started | 1 |
| 3 | Shared admin shell and settings | Not started | 1–2 |
| 4 | Website engine and page data | Not started | 1–3 |
| 5 | Automatic section and block registry | Not started | 4 |
| 6 | Visual store/site editor | Not started | 5 |
| 7 | Themes, templates and versioning | Not started | 5–6 |
| 8 | Shared commerce core | Not started | 1–3 |
| 9 | Online Store sales channel | Not started | 4–8 |
| 10 | Checkout, payments and fulfilment | Not started | 8–9 |
| 11 | POS sales channel | Not started | 8, 10 |
| 12 | Business showcase, CV and portfolio | Not started | 4–7 |
| 13 | Plugin and extension framework | Not started | 2–8 |
| 14 | First-party plugin collection | Not started | 13 |
| 15 | Analytics, billing and plan enforcement | Not started | 8–14 |
| 16 | Security, reliability and recovery | Not started | All functional phases |
| 17 | Production launch and onboarding | Not started | 15–16 |
| 18 | Public developer ecosystem | Deferred | Stable production platform |

---

# Architecture rules that must never be broken

0. **The prototype is disposable.** Existing architecture and files may be replaced; only verified, compatible pieces should be reused.
1. **One workspace is one business or personal identity.** Every tenant-owned database record must contain `workspaceId` or be reachable through a workspace-owned parent.
2. **Online Store and POS are sales channels, not separate stores.** They share products, variants, customers, orders, inventory, discounts and analytics.
3. **Inventory belongs to a variant at a location.** Never use a single global `product.stock` field as the source of truth.
4. **Themes control presentation, not business data.** Changing a theme must not remove products, orders, services, portfolio projects or plugin data.
5. **Pages store composition as data.** Parent page files must not be edited when a merchant adds, removes or reorders a section.
6. **Components self-register.** A valid component manifest must make a section or block automatically appear in the editor.
7. **Plugins use defined extension points.** Plugins must not patch the admin shell, router, checkout or theme parent files.
8. **Permissions are server-enforced.** Hiding a UI button is not authorization.
9. **Critical financial history is immutable.** Paid orders, transactions, refunds, stock movements and commissions require audit records rather than destructive edits.
10. **Core services expose APIs.** Plugins must not query or mutate commerce tables directly.
11. **Published and draft states are separate.** Editor changes must not affect a live site until publishing succeeds.
12. **Backward compatibility is explicit.** Themes, component manifests, page schemas and plugins must have versions and migrations.

---

# Target system map

```text
Platform
├── Public marketing and onboarding
├── Merchant/business administration
├── Platform-owner administration
├── Visual website editor
├── Point of Sale application
├── Public storefront/site renderer
├── Customer, affiliate and plugin portals
└── Shared backend
    ├── Identity, workspaces and permissions
    ├── Website and publishing engine
    ├── Shared commerce core
    ├── Plugin/extension runtime
    ├── Events and jobs
    └── D1, R2 and Cloudflare infrastructure
```

---

# Required user-facing applications

## 1. Public platform website

```text
Home
Features
Templates
Pricing
Online Store
Point of Sale
Business Websites
CV & Portfolio
App Marketplace
Help
Sign in
Create workspace
```

Onboarding must offer four starting configurations:

- Commerce Business
- Business Showcase
- CV
- Portfolio

These are capability presets, not separate codebases. A workspace can enable additional capabilities later without migration to a different product.

## 2. Merchant/business administration

```text
Home
Orders / Enquiries
Products / Services / Projects
Customers / Contacts
Analytics

Sales channels
  Online Store
  Point of Sale

Marketing
Discounts
Content
Apps
Settings
```

Navigation and terminology must be generated from workspace capabilities. CV and Portfolio workspaces must not receive irrelevant commerce screens.

## 3. Platform-owner administration

```text
Overview
Workspaces
Users
Subscriptions and revenue
Domains
Deployments
Plugins
Themes
Component registry
Support
System health
Audit logs
Platform settings
```

This is an internal application with stronger authentication, platform-level permissions, support-mode auditing, emergency plugin disabling and tenant-health visibility.

## 4. Visual website editor

```text
Top bar: Exit | Page | Device | Undo | Redo | Save | Preview | Publish
Left: Page tree, sections, blocks and add controls
Centre: Isolated live draft preview
Right: Manifest-generated content/design settings
```

The editor manages versioned page documents. Draft content is never rendered publicly until an explicit publish operation succeeds.

## 5. POS application

```text
Sell
Orders
Customers
Inventory
Cash session
Settings
```

POS requires a selected shared location and register. It creates orders through the same Order Service as Online Store and deducts inventory from the selected location.

## 6. Public storefront and sites

The renderer serves ecommerce storefronts, showcases, CVs and portfolios through the same domain-resolution, theme, page and component systems. Only enabled capabilities and published content differ.

## 7. External portals

```text
Customer account
Affiliate portal
Booking/customer portal
Membership portal
```

Portal identities and permissions must remain separate from workspace staff membership.

---

# Target codebase structure

```text
src/
├── apps/
│   ├── marketing-site/
│   ├── merchant-admin/
│   ├── platform-admin/
│   ├── visual-editor/
│   ├── pos/
│   ├── storefront/
│   └── portals/
│
├── core/
│   ├── identity/
│   ├── workspaces/
│   ├── authorization/
│   ├── entitlements/
│   ├── audit/
│   ├── events/
│   └── jobs/
│
├── commerce/
│   ├── catalog/
│   ├── inventory/
│   ├── customers/
│   ├── carts/
│   ├── orders/
│   ├── discounts/
│   ├── taxes/
│   ├── payments/
│   ├── fulfillment/
│   ├── returns/
│   └── locations/
│
├── website/
│   ├── sites/
│   ├── pages/
│   ├── navigation/
│   ├── domains/
│   ├── seo/
│   ├── publishing/
│   ├── renderer/
│   ├── component-registry/
│   └── theme-engine/
│
├── content/
│   ├── services/
│   ├── portfolios/
│   ├── cv/
│   ├── blog/
│   ├── forms/
│   └── custom-types/
│
├── channels/
│   ├── online-store/
│   └── pos/
│
├── components/
│   ├── sections/
│   ├── blocks/
│   └── global/
│
├── themes/
├── plugins/
│   ├── registry/
│   ├── runtime/
│   ├── permissions/
│   ├── extension-points/
│   └── first-party/
│
├── infrastructure/
│   ├── database/
│   ├── migrations/
│   ├── storage/
│   ├── cache/
│   ├── queues/
│   ├── email/
│   ├── payments/
│   └── cloudflare/
│
└── shared/
    ├── ui/
    ├── types/
    ├── validation/
    ├── errors/
    ├── testing/
    └── utilities/
```

This is one modular monolith and initially one deployable system. The folder boundaries prevent coupling without introducing premature microservice cost.

---

# Target database domains

| Domain | Principal tables |
|---|---|
| Identity | `users`, `sessions`, `workspace_members`, `roles`, `role_permissions`, `invitations` |
| Workspaces | `workspaces`, `workspace_capabilities`, `audit_events` |
| Plans | `plans`, `plan_entitlements`, `workspace_subscriptions`, `usage_records` |
| Website | `sites`, `domains`, `pages`, `page_versions`, `component_instances`, `navigation_menus`, `navigation_items`, `redirects`, `assets` |
| Themes | `themes`, `theme_versions`, `theme_installations` |
| Commerce | `products`, `product_variants`, `collections`, `collection_products`, `channel_publications`, `locations`, `inventory_levels`, `inventory_movements` |
| Customers/orders | `customers`, `customer_addresses`, `carts`, `cart_lines`, `orders`, `order_lines`, `transactions`, `fulfillments`, `returns`, `refunds` |
| POS | `pos_registers`, `pos_devices`, `pos_staff_sessions`, `cash_sessions`, `cash_movements`, `receipts` |
| Flexible content | `content_type_definitions`, `content_field_definitions`, `content_entries`, `content_field_values` |
| Plugins | `plugin_definitions`, `plugin_versions`, `plugin_installations`, `plugin_permissions`, `plugin_settings`, `plugin_migrations`, `event_deliveries` |
| Leads/forms | `forms`, `form_fields`, `form_submissions`, `contacts` |

The current generic `content_items` table must not become the permanent product/service/portfolio model. Migrate useful prototype records into the appropriate new domain when that domain is implemented.

---

# Backend service boundaries

User interfaces and plugins must call domain services instead of accessing tables directly:

```text
WorkspaceService
PermissionService
EntitlementService
SiteService
PageService
PublishingService
ThemeService
CatalogService
InventoryService
CustomerService
CartService
OrderService
PaymentService
FulfillmentService
PosService
PluginService
EventService
```

Online Store and POS must both create orders through `OrderService`. The service verifies tenant access, prices, discounts, tax and inventory; writes the order, payment and stock movements transactionally; and then emits versioned events.

---

# Plugin architecture requirements

Plugins combine WordPress-style discovery and hooks with Shopify-style permissions and controlled extension targets.

```text
plugins/{plugin-id}/
├── plugin.manifest.ts
├── permissions.ts
├── database/migrations/
├── server/services/
├── server/events/
├── admin/pages/
├── storefront/sections/
├── storefront/blocks/
├── pos/extensions/
├── automations/
├── locales/
└── tests/
```

Initial extension targets:

```ts
type ExtensionTarget =
  | "admin.navigation"
  | "admin.dashboard.card"
  | "admin.product.action"
  | "admin.order.action"
  | "storefront.section"
  | "storefront.block"
  | "pos.tile"
  | "pos.order.action"
  | "automation.trigger"
  | "automation.action";
```

Plugins receive approved service APIs, namespaced settings/storage and versioned business events. They do not receive unrestricted database access or permission to patch parent files. Arbitrary third-party backend execution remains deferred.

---

# Replacement strategy

The existing application may be substantially rewritten. Follow these rules:

1. Create the target `src/` boundaries and new schema deliberately.
2. Preserve prototype availability only where practical; preserving its internal architecture is not a goal.
3. Reuse individual UI components only after moving them into the correct application or shared UI boundary.
4. Do not build adapters solely to protect a poor prototype abstraction.
5. Migrate valuable existing data before dropping obsolete tables.
6. Complete and test one vertical slice before deleting its old implementation.
7. Remove obsolete routes, components and tables as soon as their replacements and migrations are verified.

The first replacement vertical slice is:

```text
Create workspace
→ Open capability-aware merchant dashboard
→ Create a page
→ Add an automatically registered section
→ Save a draft
→ Publish
→ Resolve and render the public website
```

---

# Phase 0 — Clean foundation and controlled reset

## Goal

Establish the new application/domain boundaries and a safe replacement path. The current architecture may be removed wherever it conflicts with the target.

## Work

- Audit current routes, components, API handlers, D1 schema, migrations and Cloudflare configuration only to classify them as `reuse`, `migrate` or `replace`.
- Record prototype flows that must remain available until replaced:
  - Landing page
  - Create workspace
  - Dashboard
  - Website overview
  - Page manager
  - Builder/editor
  - Themes
  - Public site route
- Preserve unrelated user changes, but do not preserve incompatible platform architecture merely because it already exists.
- Create the target `src/apps`, `src/core`, `src/website`, `src/commerce`, `src/channels`, `src/plugins`, `src/infrastructure` and `src/shared` boundaries.
- Define dependency rules so applications depend on domain services and shared UI, while domains do not import application screens.
- Create a new migration baseline and data-migration policy; do not silently mutate or discard existing production data.
- Add an architecture decision record covering:
  - Modular monolith
  - D1 primary database
  - R2 asset storage
  - Workspace tenant boundary
  - Sales-channel model
  - Registry-driven components and plugins
- Add architecture decision records for:
  - Separate merchant admin, platform admin, visual editor, POS, storefront and portal surfaces
  - Domain services as the only supported mutation boundary
  - Existing prototype replacement policy
- Establish test commands for type checking, linting, unit tests and production build.
- Add a smoke-test matrix for the platform website, merchant admin, platform admin, editor, POS shell and public renderer.
- Document local development and Cloudflare deployment commands.

## Deliverables

- Target architecture decision records
- Reuse/migrate/replace inventory
- Target folder boundaries
- Clean database and migration strategy
- Passing baseline build and tests
- Prototype-removal checklist

## Definition of done

- Every existing platform area is classified as reusable, migratable or replaceable.
- The new source boundaries exist and their allowed dependency directions are documented.
- No unrelated user-created changes are overwritten, while incompatible architecture is explicitly scheduled for removal.
- A fresh clone can install, build and run using documented commands.
- Critical prototype routes and all new application shells have automated or scripted smoke checks.
- The first replacement vertical slice has a written implementation and migration sequence.

## Completion record — 2026-08-28

- Classified current routes, platform components, builder/theme code, database tables and Cloudflare tooling as reuse, migrate or replace in `docs/architecture/prototype-inventory.md`.
- Created six accepted architecture decisions covering the modular monolith, tenancy/sales channels, registry extensibility, application surfaces, domain services and prototype replacement.
- Established tracked `src/` boundaries for applications, core, commerce, website, content, channels, components, themes, plugins, infrastructure and shared code.
- Registered contracts and documented shell directories for all seven planned application surfaces without implementing Phase 1 product features.
- Documented immutable migration history, expand/backfill/verify/switch/contract migration policy, rollback and production procedure.
- Documented the first replacement vertical slice and prototype-removal conditions.
- Added architecture and temporary-route contract tests plus a deployment smoke matrix covering every Phase 0 preserved flow: landing/onboarding, dashboard, website overview, page manager, editor, themes and both public-site route forms.
- Added fresh-clone, development, verification, D1 deployment and rollback guidance.
- Added a project-local typed Cloudflare binding contract for D1, assets and image bindings.
- Added reproducible `typecheck`, architecture-test and post-build-test commands.
- Re-audited all six definition-of-done criteria on 2026-08-28; missing shell directories and incomplete preserved-route coverage were corrected.
- Fresh-copy verification passed after `npm ci`: TypeScript, ESLint, 8 architecture/route contracts, Vinext production build and all 13 post-build tests.
- Phase 1 was not started.

## Next instruction to give Codex

> Implement Phase 1 from `PLATFORM_IMPLEMENTATION_PLAN.md` only. Build workspace types, capabilities and reliable public onboarding inside the verified Phase 0 boundaries. Reuse prototype code only when it fits those boundaries. Test all four workspace types, update the plan status and do not start Phase 2.

---

# Phase 1 — Product model and workspace onboarding

## Goal

Let a user create the correct kind of workspace without creating separate applications.

## Workspace types

```ts
type WorkspaceType =
  | "commerce_business"
  | "business_showcase"
  | "cv"
  | "portfolio";
```

## Capabilities

Workspace type selects defaults, while capabilities control actual features:

```ts
type Capability =
  | "website"
  | "catalog"
  | "checkout"
  | "pos"
  | "services"
  | "portfolio"
  | "blog"
  | "bookings";
```

This allows a showcase business to enable ecommerce later without migrating to another product.

## Work

- Replace the generic workspace `mode` concept with a validated workspace type and capabilities.
- Build public onboarding with four selectable outcomes:
  - Sell online and in person
  - Showcase a business
  - Create a CV
  - Create a portfolio
- Ask only essential setup questions:
  - Workspace/site name
  - Preferred slug
  - Type
  - Business category when applicable
- Create sensible starter pages and enabled modules for each type.
- Make onboarding idempotent so repeated submissions cannot create duplicate workspaces.
- Redirect reliably to the new workspace dashboard.
- Keep authentication optional/public during the current prototype stage, but isolate the temporary public-owner logic so Phase 2 can replace it.

## Definition of done

- Each workspace type can be created from the public onboarding flow.
- “Create my workspace” always opens a working dashboard.
- Each type receives appropriate navigation and starter content.
- Workspace type can enable more capabilities later without data loss.

## Completion record — 2026-08-28

- Replaced the runtime `mode` contract with validated `WorkspaceType` and additive `Capability` contracts; the legacy database column remains write-only compatibility data for existing prototype tables until its controlled removal.
- Added four public onboarding choices with workspace/site name, preferred slug, type and conditional business category fields.
- Added per-type capability presets and starter page sets with editable starter hero content.
- Added a canonical migration for workspace type, business category, idempotency keys and normalized workspace capabilities, including legacy workspace backfill.
- Made workspace creation idempotent for repeated and concurrent submissions and return a stable dashboard destination after selecting the new workspace.
- Isolated the temporary public-owner identity adapter so Phase 2 can replace it without changing workspace creation rules.
- Made merchant navigation, dashboard terminology, content management, settings and public-site navigation respond to workspace type and enabled capabilities.
- Added an additive capability update path; enabling more capabilities never deletes existing capabilities or workspace content.
- Verified the full migration chain against a legacy store workspace and confirmed conversion to `commerce_business` with website, catalog, checkout and POS capabilities.
- Definition-of-done review on 2026-08-28 corrected retry-after-reload ownership handling, protected business category data during unrelated settings updates and made mobile navigation capability-aware.
- Fresh-copy verification passed after `npm ci`: TypeScript, ESLint, 8 architecture/route contracts, Vinext production build and all 20 post-build tests, including seven focused Phase 1 contracts covering all four workspace types.
- Phase 2 was not started.

## Next instruction to give Codex

> Start Phase 2 from `PLATFORM_IMPLEMENTATION_PLAN.md`. Add multi-tenant authentication, memberships, roles, permissions and audit logs. Include cross-workspace isolation tests, update the plan status and do not start Phase 3.

---

# Phase 2 — Multi-tenant identity and permissions

## Goal

Securely isolate businesses and prepare for owners, staff, POS operators and plugin permissions.

## Roles

- Platform owner
- Workspace owner
- Administrator
- Website editor
- Store manager
- POS manager
- POS staff
- Support/view-only

## Work

- Implement authentication after the public prototype is stable.
- Create users, memberships, roles, capabilities and invitations.
- Add an authorization service used by every protected API mutation.
- Apply workspace scoping at repository/service level.
- Create audit logs for sensitive changes.
- Add session management and account recovery.
- Add optional staff PIN authentication for future POS devices.
- Protect against cross-workspace object access.
- Define plugin permission scopes separately from staff permissions.

## Definition of done

- Two different workspaces cannot read or modify each other’s records.
- Permissions are enforced by APIs and services.
- Owners can invite and manage staff.
- Sensitive actions create audit events.

## Next instruction to give Codex

> Implement Phase 2 from the master plan. Add multi-tenant authentication, memberships, roles, permissions and audit logs. Include cross-workspace isolation tests and update the plan status.

---

# Phase 3 — Shared admin shell and settings

## Goal

Build the minimal Shopify/WordPress-inspired interface that dynamically adapts to workspace capabilities.

## Navigation model

```text
Home
Orders or Enquiries
Products / Services / Projects
Customers or Contacts
Analytics

Sales channels
  Online Store
  Point of Sale

Apps
Settings
```

## Work

- Create one reusable responsive admin shell.
- Build dynamic navigation from core modules, enabled capabilities and plugin registrations.
- Add workspace switcher and global search/command palette.
- Add dashboard cards driven by real data, with useful empty states when data is absent.
- Add settings categories:
  - Business details
  - Users and permissions
  - Locations
  - Domains
  - Payments
  - Checkout
  - Shipping/delivery
  - Taxes
  - Notifications
  - Files
  - Plans and billing
  - Custom data
  - Apps
- Make desktop and mobile navigation production-ready.

## Definition of done

- Navigation changes automatically by workspace capabilities.
- POS and Online Store appear under Sales channels.
- CV and Portfolio users do not see irrelevant commerce screens.
- No plugin requires an edit to the admin-shell component to add navigation.

## Next instruction to give Codex

> Implement Phase 3 from the master plan. Redesign the shared admin shell and settings architecture with dynamic capability-based navigation. Preserve existing routes where possible, verify desktop/mobile, and update the plan status.

---

# Phase 4 — Website engine and page data

## Goal

Create a channel-neutral website engine used by stores, showcase sites, CVs and portfolios.

## Core entities

- Site
- Page
- Page version
- Component instance
- Navigation menu
- Redirect
- Domain
- Asset
- SEO metadata

## Work

- Separate website/site records from workspace records.
- Replace unvalidated free-form section JSON with a versioned page-document schema.
- Store draft and published page versions separately.
- Add page types and templates:
  - Home
  - Standard page
  - Product
  - Collection
  - Service
  - Portfolio project
  - Blog/article
  - Contact
- Add navigation menus and nested menu items.
- Add SEO title, description, canonical URL, social image and indexing controls.
- Add redirect management.
- Resolve public sites using workspace slug or verified custom domain.
- Add preview tokens that do not publish drafts.

## Definition of done

- Pages can be created, duplicated, drafted, published, unpublished and deleted safely.
- Draft changes never leak to the live site.
- Custom domains resolve to the correct workspace and published site.
- One renderer supports all workspace types.

## Next instruction to give Codex

> Implement Phase 4 from the master plan. Build the versioned website/page engine, draft-publish separation, navigation, SEO and domain resolution. Migrate existing page data safely and update the plan status.

---

# Phase 5 — Automatic section and block registry

## Goal

Make new components automatically appear in the editor without editing parent files, routes or a hand-written central registry.

## Required component package

```text
components/sections/hero-split/
├── component.tsx
├── manifest.ts
├── defaults.ts
├── styles.css
├── thumbnail.webp
└── migrations.ts
```

## Manifest responsibilities

- Stable component type
- Display name and category
- Version
- Setting schema
- Default settings
- Allowed child blocks
- Allowed workspace/page types
- Preview thumbnail
- Compatibility and migration information

## Work

- Define typed section and block manifests.
- Implement build-time automatic manifest discovery.
- Generate a component registry consumed by the editor and renderer.
- Validate settings on both client and server.
- Support sections, blocks and nested blocks with controlled depth.
- Support global components such as announcement bar, header and footer.
- Add component-version migrations.
- Add component error boundaries so one broken component does not break the page/editor.
- Build starter components:
  - Announcement bar
  - Header
  - Hero
  - Rich text
  - Image with text
  - Columns
  - Gallery
  - Testimonials
  - CTA
  - Contact form
  - Featured products
  - Featured services
  - Portfolio grid
  - Footer

## Definition of done

- Adding a valid component folder automatically exposes it in “Add section/block.”
- No parent page or layout file is edited for registration.
- Invalid manifests fail validation with a clear developer error.
- Existing saved pages continue rendering after component upgrades.

## Next instruction to give Codex

> Implement Phase 5 from the master plan. Create the typed, auto-discovered section/block registry and migrate current sections into independent component packages. Prove registration by adding one example section without touching a parent file, then update the plan status.

---

# Phase 6 — Visual store/site editor

## Goal

Build a reliable Shopify-style visual editor with WordPress-like block flexibility.

## Layout

- Left: page tree, section hierarchy and add controls
- Centre: live responsive preview
- Right: selected section/block settings
- Top: page selector, device selector, undo/redo, save and publish

## Work

- Render draft page documents in an isolated preview.
- Add section/block insertion, selection, duplication, deletion and reorder.
- Add drag-and-drop with keyboard-accessible alternatives.
- Generate settings controls from manifests.
- Add desktop, tablet and mobile preview.
- Add undo/redo history.
- Add autosave with visible status.
- Add unsaved-change protection.
- Add preview, save and publish as separate actions.
- Add global header/footer editing through component groups.
- Add responsive visibility and spacing controls.
- Add editor-safe events when sections are selected or reordered.

## Definition of done

- A non-technical user can build and publish a page without code.
- Refreshing the editor restores the latest saved draft.
- Failed saves do not destroy the last valid version.
- All editor actions work on desktop and have usable mobile fallbacks.

## Next instruction to give Codex

> Implement Phase 6 from the master plan. Build the visual editor on the component registry, including page hierarchy, live preview, generated settings, reorder, undo/redo, autosave and explicit publishing. Update the plan status after verification.

---

# Phase 7 — Themes, templates and versioning

## Goal

Separate design packages from merchant content and allow safe theme switching.

## Theme package

```text
themes/studio/
├── theme.manifest.ts
├── tokens.ts
├── templates/
├── presets/
├── styles/
├── assets/
└── migrations.ts
```

## Work

- Define theme manifest and design-token schema.
- Support global typography, colours, radii, spacing, buttons and container widths.
- Create template definitions composed from registered sections.
- Store merchant content independently from theme source.
- Add theme installation and version records.
- Add preview before activation.
- Add safe theme switching with content-role mapping.
- Add rollback to the previous active theme/version.
- Add style presets/variations.
- Create initial theme families for:
  - Ecommerce
  - Business showcase
  - CV
  - Portfolio

## Definition of done

- Theme switching never deletes business content.
- A merchant can preview a theme without affecting the live site.
- Updates are versioned and reversible.
- Themes use registered components rather than hardcoded page parents.

## Next instruction to give Codex

> Implement Phase 7 from the master plan. Build versioned theme packages, global design tokens, templates, previews, safe activation and rollback. Create one complete reference theme and update the plan status.

---

# Phase 8 — Shared commerce core

## Goal

Create the single source of truth shared by Online Store and POS.

## Domains

- Catalog
- Products and variants
- Collections
- Locations
- Inventory levels and stock ledger
- Customers
- Orders and order lines
- Discounts
- Taxes
- Payments
- Fulfilments
- Returns/refunds

## Work

- Replace generic commerce content with normalized products and variants.
- Add channel publication records.
- Add locations and per-location inventory.
- Use an append-only inventory movement ledger.
- Add customer profiles and addresses.
- Add order state machine and immutable order snapshots.
- Add order source fields:

```ts
channel: "online_store" | "pos" | "manual";
locationId?: string;
```

- Add discounts and basic tax calculations.
- Add service-layer APIs; UI and plugins must not access tables directly.
- Add transaction boundaries for order creation, payment recording and inventory changes.
- Add idempotency keys to critical mutations.

## Definition of done

- Products created once can be published to Online Store and/or POS.
- POS and online orders appear in one order list.
- Inventory changes accurately at the correct location.
- Refunds and cancellations create traceable reverse movements.
- Concurrent order tests cannot silently oversell stock.

## Next instruction to give Codex

> Implement Phase 8 from the master plan. Build the shared commerce schema and service layer for catalog, variants, channel publication, locations, inventory ledger, customers and orders. Include transactional and tenant-isolation tests, then update the plan status.

---

# Phase 9 — Online Store sales channel

## Goal

Connect the website engine to the shared commerce core.

## Work

- Add Online Store channel configuration and status.
- Add product/collection publication controls.
- Build product, collection, search and cart storefront components.
- Add inventory-aware availability.
- Add persistent cart/session handling.
- Add product SEO and structured data.
- Add store navigation and search.
- Add customer-facing order confirmation.
- Add channel-specific domain and storefront preferences.
- Ensure general pages and commerce pages use the same theme/editor system.

## Definition of done

- A product published to Online Store appears publicly.
- Unpublished products remain inaccessible.
- Cart totals and availability are server-validated.
- Public storefront pages work through slug and custom domain.

## Next instruction to give Codex

> Implement Phase 9 from the master plan. Add the Online Store sales channel using the existing website engine and shared commerce services. Include product publication, collection, search and cart flows, then update the plan status.

---

# Phase 10 — Checkout, payments and fulfilment

## Goal

Create one trusted checkout and order-processing pipeline used by online and POS channels.

## Work

- Build server-authoritative checkout sessions.
- Add addresses, delivery methods, taxes, discounts and totals.
- Integrate the first Indian-compatible payment provider behind a payment-adapter interface.
- Verify payment webhooks with signatures and idempotency.
- Never store raw card information.
- Add Cash on Delivery and manual payment status where appropriate.
- Add order confirmation notifications.
- Add fulfilment records and statuses.
- Add cancellation, refund and return workflows.
- Add privacy-conscious checkout logging.
- Add rate limits and fraud-abuse basics.

## Definition of done

- A paid checkout creates exactly one order and inventory deduction.
- Duplicate payment webhooks do not duplicate orders or transactions.
- Failed payment does not mark the order paid.
- Refunds update financial and inventory records correctly.

## Next instruction to give Codex

> Implement Phase 10 from the master plan. Build the secure checkout, payment-adapter, webhook, fulfilment, refund and return foundations. Use test mode, add idempotency tests, and update the plan status.

---

# Phase 11 — POS sales channel

## Goal

Build a fast in-person selling interface over the same commerce system.

## POS screens

- Register/location selection
- Product grid and search
- Barcode input
- Cart
- Customer selection
- Discounts
- Payment
- Receipt
- Orders and returns
- Cash session
- POS settings

## Work

- Create POS channel configuration per workspace.
- Require a selected location and register.
- Use location inventory when completing carry-out sales.
- Create orders through the shared order service with `channel = "pos"`.
- Support cash and configurable manual payment types first.
- Add receipt generation and printing.
- Add POS staff permissions and PIN sessions.
- Add cash drawer sessions, opening amount and reconciliation.
- Add order lookup, returns and exchanges.
- Design an offline-safe queue only after the online POS is stable.
- Add POS extension slots for future plugins.

## Definition of done

- Online and POS use the same products and customers.
- A POS sale immediately reduces the selected location’s inventory.
- POS orders appear in the shared Orders screen and analytics.
- Staff cannot access actions outside their permissions.

## Next instruction to give Codex

> Implement Phase 11 from the master plan. Build the online-first POS channel over shared commerce, including location/register selection, product search, cart, customer, payment, receipt and order history. Test inventory synchronization and update the plan status.

---

# Phase 12 — Business showcase, CV and portfolio

## Goal

Use the same website engine without forcing commerce concepts onto non-commerce users.

## Business showcase

- Services
- About/team
- Gallery
- Contact and WhatsApp actions
- Enquiry forms
- Testimonials
- Optional bookings

## CV

- Profile
- Experience
- Education
- Skills
- Certifications
- Resume download
- Contact

## Portfolio

- Projects/case studies
- Categories
- Project detail pages
- Services
- Testimonials
- Contact

## Work

- Define typed content entities for services, CV entries and portfolio projects.
- Provide starter templates and sections for each type.
- Create appropriate dashboards and quick actions.
- Use contacts/enquiries rather than orders where commerce is disabled.
- Add free-plan limitations through capabilities, not separate codebases.
- Allow later upgrades to showcase/ecommerce while retaining existing content.

## Definition of done

- All three non-store experiences can be created and published.
- Their dashboards contain relevant terminology and actions.
- CV/Portfolio users do not see empty commerce navigation.
- Enabling commerce later does not require creating a new workspace.

## Next instruction to give Codex

> Implement Phase 12 from the master plan. Complete Business Showcase, CV and Portfolio content types, dashboards, templates and public rendering using the common website engine. Add upgrade-safe capability handling and update the plan status.

---

# Phase 13 — Plugin and extension framework

## Goal

Allow modules such as affiliates, bookings, loyalty and reviews to install themselves without modifying core files.

## Initial extension targets

```ts
type ExtensionTarget =
  | "admin.navigation"
  | "admin.dashboard.card"
  | "admin.product.action"
  | "admin.order.action"
  | "storefront.section"
  | "storefront.block"
  | "pos.tile"
  | "automation.trigger"
  | "automation.action";
```

## Plugin package

```text
plugins/affiliate-marketplace/
├── plugin.manifest.ts
├── permissions.ts
├── database/migrations/
├── server/services/
├── server/events/
├── admin/pages/
├── storefront/blocks/
├── pos/extensions/
├── locales/
└── tests/
```

## Work

- Define versioned plugin manifests.
- Implement automatic plugin discovery at build time.
- Add workspace installation, activation, deactivation, update and uninstall states.
- Add explicit permission approval.
- Add dynamic navigation and route registration.
- Add storefront and POS extension registries.
- Add a typed event bus:
  - `customer.created`
  - `order.created`
  - `order.paid`
  - `order.cancelled`
  - `refund.created`
  - `inventory.changed`
- Provide plugin-scoped settings, secrets and storage.
- Require plugins to access core data through service APIs.
- Add compatibility checks, migrations and rollback.
- Keep third-party arbitrary server code disabled during this phase.

## Definition of done

- Installing a sample plugin adds its pages, navigation and storefront block automatically.
- Removing/deactivating it requires no core-file edit.
- The plugin cannot access data without its approved permissions.
- Plugin failure does not take down the main dashboard or storefront.

## Next instruction to give Codex

> Implement Phase 13 from the master plan. Build the versioned, auto-discovered plugin and extension framework with lifecycle, permissions, events, dynamic admin routes, storefront blocks and POS targets. Prove it with a small sample plugin and update the plan status.

---

# Phase 14 — First-party plugin collection

## Goal

Validate the extension system using useful real modules.

## Plugin order

1. Contact Forms and Leads
2. Reviews and Testimonials
3. Booking and Appointments
4. Affiliate Marketplace
5. Loyalty and Rewards
6. Email/notification integrations

## Affiliate plugin scope

- Merchant affiliate dashboard
- Affiliate applications and approval
- Affiliate portal
- Referral links and codes
- Cookie/session attribution
- Conversion records linked to shared orders
- Commission plans
- Holding and approval periods
- Refund reversal
- Payout records and exports
- Affiliate storefront registration block
- Permissions and audit logs

## Definition of done

- Each plugin installs and uninstalls through the same framework.
- No plugin modifies the admin shell, page renderer or order tables directly.
- Affiliate commissions react correctly to payment, cancellation and refund events.
- Plugin data remains workspace-isolated.

## Next instruction to give Codex

> Start Phase 14 with the Affiliate Marketplace plugin only. Implement it entirely through Phase 13 extension APIs, including merchant panel, affiliate portal, attribution, commissions, refund reversal and payout records. Test it and update the plan; do not start the next plugin.

---

# Phase 15 — Analytics, billing and plan enforcement

## Goal

Turn the product into a measurable and chargeable SaaS without mixing plan logic throughout the UI.

## Work

- Create event-based reporting for visits, conversions, orders and POS sales.
- Build channel-comparison analytics.
- Add plan definitions and entitlements.
- Keep CV/Portfolio free according to the current product decision.
- Support Business Showcase pricing beginning at the selected entry price.
- Design Commerce/POS plan tiers after actual cost measurement.
- Enforce limits through a central entitlement service.
- Add trials, subscription status, grace periods and cancellation.
- Add usage metering where necessary.
- Add platform-owner financial and tenant-health dashboards.

## Definition of done

- Reports distinguish Online Store and POS while showing combined totals.
- Plan checks are centralized and server-enforced.
- Free and paid workspaces retain their data when plans change.
- Billing failures have predictable grace and recovery behaviour.

## Next instruction to give Codex

> Implement Phase 15 from the master plan. Add event-based channel analytics, centralized plans/entitlements and the billing-state foundation. Keep payment provider details configurable, verify plan enforcement, and update the plan status.

---

# Phase 16 — Security, reliability and recovery

## Goal

Prepare the shared platform for real businesses and financial data.

## Work

- Threat-model authentication, domains, checkout, POS and plugins.
- Validate and sanitize all external input; escape rendered content.
- Add CSRF protection where applicable.
- Add rate limiting and abuse protection.
- Encrypt sensitive plugin/payment configuration.
- Redact secrets and personal data from logs.
- Add database backup/export and restoration procedure.
- Add page/theme rollback and migration recovery.
- Add webhook retries and dead-letter handling.
- Add structured logs, error reporting and health checks.
- Add accessibility, responsive and performance audits.
- Add dependency and vulnerability review without blindly applying breaking upgrades.
- Define data retention and deletion workflows.

## Definition of done

- Security checklist passes for every public mutation.
- Backup and restoration are tested.
- A failed plugin, migration or webhook has a recovery path.
- Critical user journeys meet agreed performance and accessibility targets.

## Next instruction to give Codex

> Implement Phase 16 from the master plan as a security and reliability hardening pass. Produce a risk report, fix in-scope critical/high issues, test backup and recovery, verify performance/accessibility, and update the plan status.

---

# Phase 17 — Production launch and onboarding

## Goal

Launch a stable controlled beta before attempting a public plugin marketplace or large user volume.

## Work

- Create production and preview deployment procedures.
- Verify `business.zanisheluxe.in` and tenant-domain routing.
- Create seed/demo workspaces for every service family.
- Create onboarding checklist and contextual empty states.
- Add help documentation and support contact flow.
- Add monitoring for errors, latency, D1 usage, Worker CPU and storage.
- Add release checklist and rollback procedure.
- Onboard a small controlled beta group.
- Collect activation, publishing, first-order and POS-success metrics.
- Fix launch blockers before increasing user count.

## Definition of done

- A new user can create and publish the appropriate site without developer intervention.
- A commerce user can complete both an online and POS test sale.
- Custom domains, SSL, payments and receipts work in production.
- Monitoring and rollback are operational.

## Next instruction to give Codex

> Implement Phase 17 from the master plan. Prepare and verify the controlled production beta, including deployment, domains, demo workspaces, onboarding, monitoring, release checklist and rollback. Update the plan with final launch results.

---

# Phase 18 — Public developer and plugin ecosystem (deferred)

## Start only after

- Core APIs are stable and versioned.
- The first-party plugins have proven the extension model.
- Permission and isolation systems have passed security review.
- We can support plugin developers and incident response.

## Future work

- Developer accounts and organizations
- Plugin SDK and CLI
- Public API documentation
- Sandboxed or externally hosted plugin runtime
- Submission and review process
- Automated security scanning
- Marketplace listings
- Plugin billing and revenue sharing
- Ratings and reviews
- Version compatibility and deprecation policy
- Emergency disable/recall mechanism

---

# Cross-phase testing requirements

Every implementation phase must consider:

| Test area | Required coverage |
|---|---|
| Tenant isolation | Workspace A cannot access Workspace B records |
| Authorization | API rejects missing permissions |
| Data migration | Existing records survive schema upgrades |
| Mobile UI | Core tasks remain usable on small screens |
| Accessibility | Keyboard, focus, labels and contrast |
| Failure handling | Clear errors without data corruption |
| Idempotency | Repeated critical requests produce one result |
| Publishing | Draft and live content remain isolated |
| Extensibility | No parent-file edits for registered modules |
| Deployment | Production build and Cloudflare deployment config validate |

---

# Scope discipline

## Build now

- Modular monolith
- Workspace isolation
- Website engine
- Component registry
- Visual editor
- Shared commerce core
- Online Store
- Online-first POS
- First-party controlled plugins

## Delay until validated by users

- Native Android/iOS POS applications
- Full offline POS synchronization
- Arbitrary third-party backend code
- Public plugin marketplace
- Multiple independent microservices
- Advanced international tax engines
- Automated multi-vendor payouts
- Enterprise warehouse management

This sequencing protects the annual cost target and prevents premature infrastructure complexity.

---

# Immediate next action

Phases 0 and 1 are verified complete. Begin **Phase 2 — Multi-tenant identity and permissions**. Do not begin Phase 3 until every Phase 2 definition-of-done check passes.

Use this instruction:

> Start Phase 2 from `PLATFORM_IMPLEMENTATION_PLAN.md`. Add multi-tenant authentication, memberships, roles, permissions and audit logs. Include cross-workspace isolation tests, update the plan status and do not start Phase 3.
