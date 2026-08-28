# Development and Cloudflare deployment

## Requirements

- Node.js 22.13 or newer
- npm matching the lockfile environment
- GNU `timeout` for the verified build helper
- Cloudflare account, D1 database and Wrangler authentication for remote deployment

## Fresh clone

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:postbuild
```

The repository also provides `npm run install:ci`, which creates an isolated writable runtime/cache and performs a bounded verified install. It is useful in managed build environments.

## Local development

```bash
npm run dev
```

The Vite Cloudflare plugin uses a project-local Wrangler/Miniflare state directory. Database-backed flows require a `DB` D1 binding. Local secrets belong in ignored environment files or Wrangler secret storage, never source control.

## Verification commands

```bash
npm run typecheck
npm run lint
npm run test:architecture
npm run build
npm run test:postbuild
```

`npm test` runs the complete ordered verification.

## External Cloudflare configuration

The current build reads:

- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_D1_DATABASE_NAME` (optional name override)

The Worker binding name is `DB`. The placeholder ID in source is only a build-time fallback and is not a production database.

Binding types are declared in `worker-configuration.d.ts`. Add new bindings to both the Cloudflare configuration and that environment contract so a missing or incorrectly named binding fails type checking.

## Production build

```bash
npm ci
npm test
```

The repository build script runs a bounded Vinext/Vite build. Generated output is written to `dist/` and must not be treated as source.

## D1 migrations and deployment

Use the canonical Drizzle migration chain. Never rewrite a migration already applied to production, and never rely on an ad-hoc setup SQL file after the replacement migration chain is established.

Before a structural production migration:

1. Record the deployed commit and migration journal.
2. Back up/export the D1 database.
3. Apply the reviewed migration against the remote D1 database.
4. Run migration verification queries.
5. Deploy the Worker using the generated Wrangler configuration.
6. Run the deployment smoke matrix.

Current generated deployment command:

```bash
npx wrangler deploy --config dist/server/wrangler.json
```

Remote database name currently used by the deployment is `business-platform-db`. Migration commands must be reviewed against the actual generated configuration before execution. Do not combine a destructive database migration and Worker deployment until backup and verification steps are defined.

## Rollback

- Application: redeploy the last verified commit compatible with the current schema.
- Expand-stage migration: leave added tables/columns in place and roll back application code.
- Destructive migration: restore the verified pre-migration D1 backup, then deploy the compatible application release.
- Theme/page changes: future versions use application-level published-version rollback rather than database restoration.
