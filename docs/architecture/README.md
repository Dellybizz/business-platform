# Platform architecture

This directory records the non-negotiable architecture for the replacement platform.

## Decision index

| Decision | Subject |
|---|---|
| [ADR-0001](./decisions/ADR-0001-modular-monolith.md) | Modular monolith on Cloudflare |
| [ADR-0002](./decisions/ADR-0002-tenancy-and-sales-channels.md) | Workspace tenancy and shared sales channels |
| [ADR-0003](./decisions/ADR-0003-registry-extensibility.md) | Registry-driven sections, themes and plugins |
| [ADR-0004](./decisions/ADR-0004-application-surfaces.md) | Separate user-facing application surfaces |
| [ADR-0005](./decisions/ADR-0005-domain-service-boundaries.md) | Domain services as mutation boundaries |
| [ADR-0006](./decisions/ADR-0006-prototype-replacement.md) | Controlled replacement of the prototype |

## Operating documents

- [Prototype inventory](./prototype-inventory.md)
- [Data migration strategy](./data-migration-strategy.md)
- [First replacement vertical slice](./first-vertical-slice.md)
- [Prototype removal checklist](./prototype-removal-checklist.md)
- [Smoke-test matrix](./smoke-test-matrix.md)
- [Development and deployment](../operations/development-and-deployment.md)

## Dependency direction

```text
apps -> channels/content/commerce/website/core -> infrastructure
  |                   |                         |
  +-------------------+-------------------------+-> shared

plugins -> published domain service APIs + extension contracts
components/themes -> website contracts + shared UI
```

The following directions are forbidden:

- A domain importing from `src/apps`.
- Core or infrastructure importing application screens.
- Commerce importing website, POS or Online Store UI.
- Online Store or POS implementing separate product, customer, order or inventory stores.
- Plugins importing database schemas or infrastructure adapters.
- Themes owning transactional or merchant business data.

