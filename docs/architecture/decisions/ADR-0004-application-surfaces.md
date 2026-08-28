# ADR-0004: Separate application surfaces

- **Status:** Accepted
- **Date:** 2026-08-28

## Decision

The platform has seven independently routed surfaces with separate layouts and permission contexts:

1. Public marketing and onboarding
2. Merchant administration
3. Platform-owner administration
4. Visual website editor
5. Point of Sale
6. Public storefront/site renderer
7. Customer, affiliate and other external portals

They may share UI primitives and domain services but must not share a single navigation shell or assume the same identity role.

## Consequences

- Merchant staff, platform operators and storefront customers are distinct authorization subjects.
- The editor and POS can optimize their layouts without complicating merchant navigation.
- Route ownership must be explicit in the application-surface registry.

