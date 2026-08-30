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

## Google sign-in through Supabase Auth

Supabase handles Google identity verification. Workspace data, authorization, sessions, commerce data, and content remain in Cloudflare D1/R2.

1. Enable Google in **Supabase → Authentication → Providers** and enter the Google OAuth client ID and secret there.
2. Add the Supabase provider callback to the Google Cloud Web OAuth client:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

3. In **Supabase → Authentication → URL Configuration**, set the Site URL to `https://business.zanisheluxe.in` and add:

```text
https://business.zanisheluxe.in/auth/callback
```

4. Add these browser-safe values to the Cloudflare build environment and redeploy:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never expose a Supabase secret key or `service_role` key. The Google client secret belongs in Supabase, not in the Cloudflare Worker.
