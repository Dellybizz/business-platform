# ADR-0005: Domain services are the mutation boundary

- **Status:** Accepted
- **Date:** 2026-08-28

## Decision

Application routes, channels and plugins call domain services. They do not perform direct commerce mutations or import database schemas. Repositories and infrastructure adapters remain internal to their owning domain.

Critical mutations accept an explicit tenant context and idempotency key. The shared Order Service is the only order-creation workflow for Online Store, POS and manual orders. It validates prices, discounts, tax and inventory; commits consistent records; and emits versioned events after a successful transaction.

## Consequences

- API handlers stay thin and transport-focused.
- Business invariants have one implementation.
- Plugins remain compatible when storage changes.
- Service contracts and transactional tests are mandatory before commerce launch.

