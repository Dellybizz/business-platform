# ADR-0002: Workspace tenancy and shared sales channels

- **Status:** Accepted
- **Date:** 2026-08-28

## Decision

A workspace is the tenant boundary for a business or personal presence. Every tenant-owned record contains `workspaceId` or belongs to a workspace-owned aggregate whose service enforces that boundary.

Online Store and POS are channels over one commerce core. Products, variants, customers, orders, discounts and analytics are shared. Inventory is held for a variant at a shared location. Orders identify their source channel and, where applicable, their location and POS register.

CV, Portfolio and Business Showcase are capability presets over the website/content engine. A workspace can enable commerce later without being copied into another product.

## Consequences

- Tenant context is mandatory in domain-service calls.
- Cross-workspace access tests are required for every tenant-owned domain.
- No `product.stock` field can be the inventory source of truth.
- Channel-specific configuration is separate from shared commerce data.

