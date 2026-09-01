# Modulo - Revised Master Implementation Plan

**Roadmap:** Phases 0-25

**Product direction:** Shopify-style shared commerce architecture, WordPress-style modularity, Wix-inspired creative editing and separately activated Website/POS services.

## Delivery stages

| Stage | Phases | Outcome |
|---|---:|---|
| Build now | 1-15 | Complete the core products and enter controlled beta |
| Controlled beta | 15-20 | Validate, harden, monetize and prepare public release |
| Post-launch | 20-25 | Add offline, enterprise, marketplace, mobile and AI expansion |

> Phase 15 is the beta-entry boundary. Phase 20 is the public-launch boundary. The overlap is intentional.

## Current verified status

- Phases 0-6: Complete.
- Phase 7: Next phase.
- Phases 7-25: Not started.

## Product rules

- Website and POS are separate services and must be explicitly activated.
- Website-only, POS-only and combined Website + POS plans must all work.
- Combined services share catalogue, inventory, customers and orders through the commerce core.
- Every service receives a focused dashboard generated from entitlements and capabilities.
- Ecommerce supports Guided and Advanced editor levels over the same page-document schema.
- CV and Portfolio support Guided and Creative editor levels using purpose-built content models.
- Components and apps self-register through manifests and controlled targets without editing parent files.
- The platform remains a modular monolith until measured scale proves that extraction is necessary.

## Progress tracker

| Phase | Name | Stage | Status |
|---:|---|---|---|
| 0 | Clean foundation and controlled reset | Foundation | Complete |
| 1 | Workspace types and onboarding | Build now | Complete |
| 2 | Multi-tenant identity and permissions | Build now | Complete |
| 3 | Shared shell and capability-aware dashboards | Build now | Complete |
| 4 | Service catalogue, opt-in and entitlements | Build now | Complete |
| 5 | Website engine and versioned page data | Build now | Complete |
| 6 | Automatic component and extension registry | Build now | Complete |
| 7 | Themes, layouts and content-safe versioning | Build now | Not started |
| 8 | Shared editor document model | Build now | Not started |
| 9 | Guided ecommerce builder | Build now | Not started |
| 10 | Advanced ecommerce visual editor | Build now | Not started |
| 11 | CV, portfolio and showcase builders | Build now | Not started |
| 12 | Shared commerce core | Build now | Not started |
| 13 | Online Store channel and commerce rendering | Build now | Not started |
| 14 | Checkout, payments and order operations | Build now | Not started |
| 15 | Online-first POS MVP and beta gate | Beta boundary | Not started |
| 16 | Plugin runtime and private app library | Beta stage | Not started |
| 17 | Analytics, billing and service plan enforcement | Beta stage | Not started |
| 18 | Security, reliability, backup and observability | Beta stage | Not started |
| 19 | Beta expansion and priority commerce modules | Beta stage | Not started |
| 20 | Public launch readiness and release | Launch boundary | Not started |
| 21 | Advanced POS and offline synchronization | Post-launch | Not started |
| 22 | Advanced B2B, subscriptions, wallet and automation | Post-launch | Not started |
| 23 | Public developer platform and App Marketplace | Post-launch | Not started |
| 24 | Marketplace, quick commerce and logistics products | Post-launch | Not started |
| 25 | Branded mobile apps, AI and scale evolution | Post-launch | Not started |

## Phase instructions

# Phase 0 - Clean foundation and controlled reset

**Status:** Complete

**Delivery stage:** Foundation

## Goal

Preserve the verified modular-monolith baseline and controlled prototype replacement path.

## Work

- Maintain application and domain boundaries.
- Keep migration, deployment and rollback documentation current.
- Retain architecture, route-contract and fresh-clone verification.

## Definition of done

- Existing areas remain classified as reuse, migrate or replace.
- Fresh clone installs, tests and builds.
- No later phase weakens tenant or domain boundaries.

## Instruction to give Codex

> Review Phase 0 against its definition of done. Fix anything incomplete. If everything passes, keep it marked Complete. Do not start Phase 1.

---

# Phase 1 - Workspace types and onboarding

**Status:** Complete

**Delivery stage:** Build now

## Goal

Create commerce, showcase, CV and portfolio workspaces through one capability-based platform.

## Work

- Retain four workspace presets and idempotent creation.
- Preserve capability-aware starter content and navigation.
- Keep upgrades additive and non-destructive.

## Definition of done

- All four workspace types create successfully.
- Create workspace always reaches a working dashboard.
- Additional capabilities can be enabled without migration.

## Instruction to give Codex

> Review Phase 1 against its definition of done. Fix anything incomplete. If everything passes, keep it marked Complete. Do not start Phase 2.

---

# Phase 2 - Multi-tenant identity and permissions

**Status:** Complete

**Delivery stage:** Build now

## Goal

Securely isolate businesses, staff, platform roles and future plugin permissions.

## Work

- Retain authentication, memberships, roles, invitations and session recovery.
- Enforce workspace scope in repositories and services.
- Keep plugin scopes separate from staff roles.
- Audit sensitive operations.

## Definition of done

- Cross-workspace access tests pass.
- Every protected mutation is server-authorized.
- Staff management and audit records remain functional.

## Instruction to give Codex

> Review Phase 2 against its definition of done. Fix anything incomplete. If everything passes, keep it marked Complete. Do not start Phase 3.

---

# Phase 3 - Shared shell and capability-aware dashboards

**Status:** Complete

**Delivery stage:** Build now

## Goal

Provide the responsive administration shell from which service-specific dashboards are generated.

## Work

- Retain responsive navigation, workspace switching and command search.
- Generate terminology and routes from enabled capabilities.
- Allow plugins to register navigation without editing the shell.

## Definition of done

- Commerce navigation never leaks into CV/portfolio by default.
- All generated destinations resolve.
- Desktop and mobile shell tests pass.

## Instruction to give Codex

> Review Phase 3 against its definition of done. Fix anything incomplete. If everything passes, keep it marked Complete. Do not start Phase 4.

---

# Phase 4 - Service catalogue, opt-in and entitlements

**Status:** Complete

**Delivery stage:** Build now

## Goal

Make Website and POS separately purchasable services that may also be sold as a combined package.

## Work

- Introduce service products: Ecommerce Website, POS, Business Showcase, CV and Portfolio.
- Require explicit opt-in before a service is activated.
- Separate workspace capabilities from purchased service entitlements.
- Add service activation, suspension, trial and cancellation states.
- Create a combined-business overview plus dedicated service dashboards.
- Migrate existing commerce_business defaults without losing data.

## Definition of done

- Website-only and POS-only businesses work independently.
- Combined customers share catalogue, inventory, customers and orders.
- Navigation and billing reflect only explicitly activated services.
- Entitlement checks are centralized and server-enforced.

## Instruction to give Codex

> Start Phase 4 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 5.

Review Phase 4 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 5 - Website engine and versioned page data

**Status:** Complete

**Delivery stage:** Build now

## Goal

Create the common publishing engine for ecommerce, showcase, CV and portfolio sites.

## Work

- Separate sites from workspaces.
- Create versioned page documents with draft and published states.
- Add pages, navigation, redirects, domains, assets and SEO metadata.
- Resolve sites by slug and verified custom domain.
- Provide secure preview tokens and page rollback.

## Definition of done

- Draft changes never appear publicly.
- Pages support create, duplicate, publish, unpublish and safe delete.
- One renderer supports every site service.

## Completion record - 2026-08-31

- Added a workspace-owned Site aggregate with versioned page documents, independent mutable drafts and immutable published snapshots.
- Added safe create, duplicate, draft save, publish, unpublish and soft-delete lifecycle operations with workspace ownership checks, permissions, active website-service entitlements and audit events.
- Added page-version history and rollback. Rollback restores a validated historical snapshot into the draft while leaving the live published pointer unchanged until an explicit publish.
- Added navigation menus with nested items, redirects, custom-domain registration, site asset metadata and structured SEO fields.
- Added secure hashed preview tokens with bounded expiry; public resolution serves drafts only for a valid, unexpired, non-revoked token.
- Added public resolution by workspace slug or verified custom domain and retained a shared renderer for ecommerce, showcase, CV and portfolio services.
- Migrated legacy sites and pages without losing published content, and verified the production D1 backfill for 32 pages, 32 drafts and 3 published versions.
- Verified Phase 5 with TypeScript, lint, architecture and route contracts, migration tests, production build and the complete post-build test suite.
- Re-reviewed the deployed workflow and closed the remaining UI integration gaps: Worker-safe builder routing, publish-in-place with a real live link, create/duplicate/publish/unpublish/delete controls, main-menu placement, correct slug-routed navigation and working multi-workspace creation/switching.
- Re-ran the full definition-of-done gate after the live fixes; TypeScript, lint, architecture contracts, the production Vinext/Cloudflare build and all post-build tests pass.
- Phase 6 was completed separately; Phase 7 was not started.

## Current development snapshot and unfinished-component disclosure

- Phases 0-6 are complete. The deployed Phase 5 review also fixed builder routing, publish-in-place, page lifecycle actions, navigation placement, real public links and multi-workspace creation/switching.
- Phases 7-25 remain not started; the existing screens for those areas are foundations or previews and must not imply that their complete workflows already exist.
- Every visible but unfinished component must show a compact `Planned for Phase X` badge using the delivery phase defined in this plan. Completed components must not display the badge.
- An unfinished control must be disabled or clearly non-destructive, include an accessible explanation, and must not navigate to a misleading dead-end screen.
- Editor-document controls such as section duplication, undo/redo, generated settings and recoverable layout operations use `Planned for Phase 8` until Phase 8 passes its definition of done.
- POS selling workflows use Phase 15, plugin installation uses Phase 16 and historical analytics/filtering uses Phase 17. Future placeholders must use their actual plan phase rather than being labelled Phase 8 indiscriminately.
- The badge is removed only when the relevant phase definition of done has been tested and marked Complete.

## Instruction to give Codex

> Start Phase 5 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 6.

Review Phase 5 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 6 - Automatic component and extension registry

**Status:** Complete

**Delivery stage:** Build now

## Goal

Let sections, blocks and editor controls appear automatically from manifests without parent-file edits.

## Work

- Define typed section/block manifests.
- Discover component packages at build time.
- Generate editor and renderer registries.
- Validate settings on client and server.
- Support nested blocks, global components, migrations and error boundaries.
- Ship starter ecommerce, business, CV and portfolio components.

## Definition of done

- A new valid component folder appears automatically.
- Invalid manifests fail with useful errors.
- Existing documents survive component upgrades.

## Completion record - 2026-09-01

- Added typed section, block and global manifests with build-time discovery of both single-file and folder packages.
- Added source-specific manifest validation, scalar settings validation and sequential version migrations shared by client and server workflows.
- Added generated section, block and global registries, manifest-driven editor fields and shared registered renderers.
- Added recursive nested blocks with a four-level safety limit, global announcement/footer packages and component error boundaries.
- Added starter ecommerce product, business service, CV summary and portfolio gallery sections; the product starter is a folder package that proves parent-file-free discovery.
- Added page-document component versions and normalization on create, read, save, rollback and publish while preserving unknown component data.
- Verified automatic folder discovery, useful invalid-manifest failures and migration preservation with dedicated tests, TypeScript, the full test suite and production build.
- Phase 7 was not started.

## Instruction to give Codex

> Start Phase 6 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 7.

Review Phase 6 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 7 - Themes, layouts and content-safe versioning

**Status:** Not started

**Delivery stage:** Build now

## Goal

Separate visual presentation from merchant data and establish layout presets for both editor levels.

## Work

- Define theme manifests, tokens, templates and style presets.
- Store merchant content separately from theme source.
- Add preview, activation, rollback and version migrations.
- Build initial Ecommerce, Showcase, CV and Portfolio theme families.
- Define data roles for automatic product, collection and project binding.

## Definition of done

- Theme changes never delete content.
- Preview does not affect the live site.
- Layouts use registered components and dynamic data sources.

## Instruction to give Codex

> Start Phase 7 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 8.

Review Phase 7 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 8 - Shared editor document model

**Status:** Not started

**Delivery stage:** Build now

## Goal

Create one document engine that supports Guided and Advanced editing without creating incompatible site formats.

## Work

- Define page, section, block, data-source, responsive-style and global-token schemas.
- Add isolated live preview, save, publish, autosave and undo/redo.
- Add section insertion, duplication, removal and accessible reorder.
- Generate settings panels from manifests.
- Add backups before layout regeneration.
- Define safe Guided-to-Advanced and Advanced-to-Guided transitions.

## Definition of done

- Both editor levels read and write the same page schema.
- Refresh restores the latest valid draft.
- Failed saves cannot destroy a valid version.
- Layout replacement always creates a recoverable backup.

## Instruction to give Codex

> Start Phase 8 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 9.

Review Phase 8 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 9 - Guided ecommerce builder

**Status:** Not started

**Delivery stage:** Build now

## Goal

Generate a complete ecommerce site for users who want minimal setup or have limited expertise.

## Work

- Ask business type, branding, collections, featured products, pages and desired content.
- Generate home, product, collection, search, cart and policy layouts.
- Bind sections to live product and collection queries.
- Provide simple form-based editing rather than layout manipulation.
- Add recommended defaults and completeness checks.
- Allow safe promotion to Advanced mode.

## Definition of done

- A merchant can publish a populated storefront without arranging sections.
- Catalogue changes update bound layouts automatically.
- Generated pages remain editable in Advanced mode.

## Instruction to give Codex

> Start Phase 9 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 10.

Review Phase 9 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 10 - Advanced ecommerce visual editor

**Status:** Not started

**Delivery stage:** Build now

## Goal

Give expert users Shopify-style structural control with additional WordPress-style block flexibility.

## Work

- Expose page tree, section hierarchy and block controls.
- Add drag-and-drop plus keyboard alternatives.
- Add responsive visibility, spacing, typography and layout controls.
- Support product, collection and standard-page templates.
- Add reusable/global sections and app blocks.
- Add controlled custom CSS only after sanitization and preview isolation.

## Definition of done

- Non-technical users can still operate the editor.
- Advanced users can restructure pages without source edits.
- Every action has desktop support and usable mobile fallback.

## Instruction to give Codex

> Start Phase 10 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 11.

Review Phase 10 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 11 - CV, portfolio and showcase builders

**Status:** Not started

**Delivery stage:** Build now

## Goal

Provide purpose-built non-commerce content models and dual-level editing rather than forcing store templates onto personal sites.

## Work

- Create typed services, experience, education, skills, certifications, projects, case studies and testimonials.
- Build Guided templates that fill structured fields automatically.
- Build Creative mode using rows, stacks, grids, layers, snapping and responsive constraints.
- Allow controlled free-position canvas sections later without sacrificing mobile layout.
- Add résumé download, galleries, enquiries and WhatsApp/contact actions.
- Create separate CV, Portfolio and Showcase dashboards.

## Definition of done

- All three site types publish without commerce concepts.
- Guided content can open in Creative mode.
- Responsive output remains stable across device previews.
- Adding commerce later preserves existing content.

## Instruction to give Codex

> Start Phase 11 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 12.

Review Phase 11 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.

---

# Phase 12 - Shared commerce core

**Status:** Not started

**Delivery stage:** Build now

## Goal

Create the single catalogue, inventory, customer and order source used by Website and POS.

## Work

- Normalize products, variants and collections.
- Add locations and append-only inventory movements.
- Add customers, addresses, carts, orders and immutable order snapshots.
- Add channel publication and order source fields.
- Implement discounts, taxes, returns and refunds.
- Expose domain services only; prohibit direct table access from UI/apps.
- Use transactions and idempotency for financial and stock mutations.

## Definition of done

- One product can publish to Website, POS or both.
- Inventory is tracked by variant and location.
- All channels appear in one order service.
- Concurrent order tests cannot silently oversell.

## Instruction to give Codex

> Start Phase 12 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 13.

Review Phase 12 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 13 - Online Store channel and commerce rendering

**Status:** Not started

**Delivery stage:** Build now

## Goal

Connect the website engine and both ecommerce builders to the shared commerce core.

## Work

- Add channel status and product/collection publication.
- Build product, collection, search and cart components.
- Add inventory-aware availability and persistent carts.
- Add SEO metadata and structured product data.
- Unify informational and commerce pages under one theme.
- Support custom domains and storefront preferences.

## Definition of done

- Published products appear; unpublished products remain inaccessible.
- Cart totals and availability are server-validated.
- Slug and custom-domain storefronts render correctly.

## Instruction to give Codex

> Start Phase 13 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 14.

Review Phase 13 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 14 - Checkout, payments and order operations

**Status:** Not started

**Delivery stage:** Build now

## Goal

Create the trusted transaction pipeline shared by Online Store and POS.

## Work

- Build server-authoritative checkout sessions.
- Add address, delivery, taxes, discounts and total calculation.
- Implement a payment adapter beginning with an Indian-compatible provider.
- Verify signed webhooks with idempotency.
- Support COD, manual payments and payment links.
- Add fulfilment, cancellation, return and refund workflows.
- Add basic notification, rate-limit and abuse controls.

## Definition of done

- A payment creates one order and one inventory deduction.
- Duplicate webhooks cannot duplicate money or orders.
- Refunds create traceable financial and stock reversals.

## Instruction to give Codex

> Start Phase 14 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 15.

Review Phase 14 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 15 - Online-first POS MVP and beta gate

**Status:** Not started

**Delivery stage:** Beta boundary

## Goal

Deliver the separately activatable POS service and reach the controlled-beta entry gate.

## Work

- Build Sell, Cart, Customer, Checkout, Orders, Inventory, Register and Settings screens.
- Require location/register selection and enforce POS staff permissions.
- Support cash, manual payment types, receipts, returns and exchanges.
- Add cash sessions, movements and reconciliation.
- Use the shared Order Service and location inventory.
- Define POS extension targets.
- Run end-to-end Website-only, POS-only and combined-business tests.
- Prepare beta deployment, demo tenants and rollback checklist.

## Definition of done

- POS and Website share data only when both are active.
- A POS sale immediately changes location inventory.
- A small invited group can complete online and POS test sales.
- No launch-blocking data-loss, tenant-isolation or payment defect remains.

## Instruction to give Codex

> Start Phase 15 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 16.

Review Phase 15 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 16 - Plugin runtime and private app library

**Status:** Not started

**Delivery stage:** Beta stage

## Goal

Validate a safe Shopify-style target system with WordPress-style registration during beta.

## Work

- Add manifests, permissions, lifecycle, migrations and compatibility checks.
- Support admin, editor, storefront and POS extension targets.
- Add typed events and webhook delivery.
- Provide namespaced settings, secrets and storage.
- Ship private first-party apps: Forms, Reviews and basic Bookings.
- Keep arbitrary third-party server execution disabled.

## Definition of done

- Apps install and remove without core-file edits.
- Apps cannot access unapproved data.
- App failure cannot take down admin, POS or storefront.

## Instruction to give Codex

> Start Phase 16 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 17.

Review Phase 16 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 17 - Analytics, billing and service plan enforcement

**Status:** Not started

**Delivery stage:** Beta stage

## Goal

Measure product usage and charge for separately activated services and bundles.

## Work

- Track visits, conversion, online orders, POS sales and service activation.
- Build combined and service-specific reports.
- Add plans, bundles, trials, grace periods and cancellation.
- Preserve free CV/Portfolio positioning and configurable Showcase pricing.
- Meter cost-driving features such as messaging, AI, storage and native apps.
- Add platform financial and tenant-health dashboards.

## Definition of done

- Website and POS reporting is separate and combined.
- Plan checks are central and server-enforced.
- Plan changes never destroy tenant data.

## Instruction to give Codex

> Start Phase 17 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 18.

Review Phase 17 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 18 - Security, reliability, backup and observability

**Status:** Not started

**Delivery stage:** Beta stage

## Goal

Harden all beta-tested surfaces before wider release.

## Work

- Threat-model identity, checkout, POS, domains and apps.
- Add input validation, output escaping, CSRF controls and rate limits.
- Encrypt sensitive integration configuration.
- Add structured logs, health checks, retry/dead-letter handling and alerting.
- Test database export, restoration and migration rollback.
- Audit accessibility, mobile usability and performance.
- Define retention, deletion and incident procedures.

## Definition of done

- Backup restoration is proven.
- Critical/high risks are fixed or explicitly blocked from launch.
- Failures have recovery paths and actionable monitoring.

## Instruction to give Codex

> Start Phase 18 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 19.

Review Phase 18 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 19 - Beta expansion and priority commerce modules

**Status:** Not started

**Delivery stage:** Beta stage

## Goal

Use real merchant feedback to add the highest-value capabilities from the research sheet.

## Work

- Add multi-location administration and stock transfers.
- Add customer groups, price lists, MOQ and volume pricing.
- Add basic loyalty ledger and memberships.
- Add abandoned-cart events and optional WhatsApp order updates.
- Add payment links and first delivery adapter.
- Measure adoption, cost and operational failure rates.

## Definition of done

- Modules are entitlement-gated and workspace-isolated.
- Every ledger operation is reversible through audited counter-entry.
- Beta metrics justify retaining each module.

## Instruction to give Codex

> Start Phase 19 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 20.

Review Phase 19 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 20 - Public launch readiness and release

**Status:** Not started

**Delivery stage:** Launch boundary

## Goal

Convert the validated beta into a supportable public initial release.

## Work

- Resolve beta blockers and complete migration rehearsals.
- Verify domains, SSL, payments, receipts and service subscriptions.
- Finalize onboarding, contextual help, support flow and status communication.
- Set usage limits and cost alerts for the initial plans.
- Publish release checklist, rollback procedure and incident ownership.
- Open onboarding gradually and monitor activation, publishing and first-sale metrics.

## Definition of done

- A new user can buy only the selected service and complete its core outcome.
- Production monitoring and rollback are operational.
- Website-only, POS-only, combined, Showcase, CV and Portfolio journeys pass.

## Instruction to give Codex

> Start Phase 20 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 21.

Review Phase 20 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 21 - Advanced POS and offline synchronization

**Status:** Not started

**Delivery stage:** Post-launch

## Goal

Extend proven POS usage with resilient offline operation and deeper retail controls.

## Work

- Add local device database and product/customer cache.
- Queue client-generated idempotent mutations while offline.
- Define stock, price and customer conflict policies.
- Add device registration, sync status and manager conflict review.
- Expand barcode, stock counts, receiving, transfers and shift reporting.

## Definition of done

- Offline sales synchronize exactly once.
- Conflicts are visible and auditable.
- No offline mutation can cross workspace, location or register boundaries.

## Instruction to give Codex

> Start Phase 21 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 22.

Review Phase 21 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 22 - Advanced B2B, subscriptions, wallet and automation

**Status:** Not started

**Delivery stage:** Post-launch

## Goal

Add revenue-expanding modules only after core commerce accounting is stable.

## Work

- Add B2B credit limits, receivables and sales representative access.
- Add subscription schedules, pause/resume, renewal and failed-payment handling.
- Add wallet/cashback as an append-only stored-value ledger.
- Add advanced loyalty tiers, expiry and refund reversal.
- Add push/SMS/WhatsApp job queues with retries and quotas.
- Add geo-aware catalogue, price and availability rules.

## Definition of done

- Financial ledgers reconcile.
- Schedulers are idempotent.
- Messaging and gateway costs are metered per workspace.

## Instruction to give Codex

> Start Phase 22 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 23.

Review Phase 22 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 23 - Public developer platform and App Marketplace

**Status:** Not started

**Delivery stage:** Post-launch

## Goal

Open the proven extension system to external developers under controlled review.

## Work

- Create developer organizations, SDK, CLI and API documentation.
- Add app submission, permission review, security scanning and compatibility tests.
- Add listings, installation consent, updates, ratings and support metadata.
- Add marketplace billing and revenue sharing.
- Add version deprecation and emergency disable/recall.
- Prefer externally hosted or sandboxed execution over arbitrary code in the core Worker.

## Definition of done

- Third-party apps cannot bypass scopes.
- Review and recall procedures are operational.
- Marketplace billing and version compatibility are testable.

## Instruction to give Codex

> Start Phase 23 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 24.

Review Phase 23 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 24 - Marketplace, quick commerce and logistics products

**Status:** Not started

**Delivery stage:** Post-launch

## Goal

Build enterprise-heavy operating models as separate premium modules rather than bloating the core.

## Work

- Add vendor onboarding, vendor inventory/orders, commissions and settlements.
- Add marketplace returns, tax responsibility and dispute records.
- Add delivery zones, time slots, dispatch and rider assignment.
- Add live tracking and logistics adapters.
- Add vendor, operations and rider portals with dedicated permissions.

## Definition of done

- Vendor and merchant funds reconcile.
- Each operational actor sees only authorized data.
- Dispatch and tracking failure modes have manual recovery.

## Instruction to give Codex

> Start Phase 24 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 25.

Review Phase 24 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Phase 25 - Branded mobile apps, AI and scale evolution

**Status:** Not started

**Delivery stage:** Post-launch

## Goal

Add high-cost differentiated products after demand, margins and support capacity are proven.

## Work

- Build tenant-configured Android/iOS app shells over shared APIs.
- Automate branding, builds, signing-key custody and release tracking.
- Add AI catalogue enrichment with quotas and review.
- Add semantic search and recommendations after sufficient data exists.
- Evaluate D1 partitioning, queues, Durable Objects or service extraction only from measured bottlenecks.
- Introduce enterprise observability, SLAs and disaster-recovery targets.

## Definition of done

- Mobile apps remain synchronized with web/POS data.
- AI output is reviewable and cost-capped.
- Scaling changes are driven by measurements rather than premature microservices.

## Instruction to give Codex

> Start Phase 25 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, and update the phase status and completion record.

Review Phase 25 against its definition of done. Fix anything incomplete. If everything passes, mark it Complete.


---

# Cross-phase testing requirements

- Workspace A cannot read or modify Workspace B records.
- APIs reject missing permissions and inactive service entitlements.
- Existing records survive migrations and service activation changes.
- Repeated critical requests remain idempotent.
- Draft and published content remain isolated.
- Core workflows remain usable on desktop and mobile.
- Keyboard, focus, labels and contrast meet accessibility requirements.
- Components and apps register without parent-file edits.
- Production build, Cloudflare bindings and migrations validate.
- Cost-driving services are measured and quota-controlled.

# Immediate next instruction

> Start Phase 6 from `MODULO_REVISED_IMPLEMENTATION_PLAN.md`. Complete it fully, test every definition-of-done item, update the phase status and completion record, and do not start Phase 7.
