# ADR-0001: Modular monolith on Cloudflare

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

The platform must support websites, ecommerce, POS and extensions on an annual infrastructure budget near ₹10,000 while it has a small initial tenant base. Independently deployed microservices would increase deployment, observability and consistency costs before the product requires them.

## Decision

Build one modular TypeScript application with explicit domain boundaries. Deploy the HTTP application to Cloudflare Workers, use D1 for relational tenant and commerce data, and use R2 for merchant-uploaded binary assets when the binding is introduced.

Domains communicate through typed services and versioned events. Folder boundaries do not imply independent deployments. A domain may be extracted only after measured scaling or operational needs justify it.

## Consequences

- One repository and deployable application remain affordable and understandable.
- Transactions spanning order, payment and inventory logic stay local.
- Architecture tests are required because process isolation does not enforce boundaries.
- Runtime code must remain compatible with the Workers environment and must not rely on a persistent local filesystem.

