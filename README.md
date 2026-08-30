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

## Google sign-in

Create an OAuth 2.0 Web application in Google Cloud and register this production redirect URI:

```text
https://business.zanisheluxe.in/api/auth/google/callback
```

Add the credentials to the deployed Cloudflare Worker as secrets/variables:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

For local development, place the same names in an ignored `.dev.vars` file and register the local callback URL shown by the development server. Never commit either credential.
