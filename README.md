# Modular Business Platform

A Cloudflare-hosted multi-tenant platform combining Shopify-style shared commerce and sales channels with WordPress-style modular sections and plugins.

The current product UI is a prototype being replaced through the phased plan in [PLATFORM_IMPLEMENTATION_PLAN.md](./PLATFORM_IMPLEMENTATION_PLAN.md).

## Architecture

- [Architecture overview and decisions](./docs/architecture/README.md)
- [Prototype classification](./docs/architecture/prototype-inventory.md)
- [Migration strategy](./docs/architecture/data-migration-strategy.md)
- [Development and deployment](./docs/operations/development-and-deployment.md)

## Verification

```bash
npm ci
npm test
```

For individual checks, see the development and deployment guide.

