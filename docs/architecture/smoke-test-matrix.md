# Smoke-test matrix

## Phase 0 automated contracts

| Surface | Temporary route/contract | Phase 0 assertion |
|---|---|---|
| Marketing Site / onboarding | `/` | Route source exists; built worker returns HTML. |
| Merchant admin | `/dashboard` | Route source and application-surface contract exist. |
| Platform admin | `platform-admin` contract | Surface is registered; route arrives in later phase. |
| Visual editor | `/builder` | Route source and application-surface contract exist. |
| POS | `pos` contract | Surface is registered; route arrives in Phase 11. |
| Storefront | `/s/[slug]` | Route source and application-surface contract exist. |
| Portals | `portals` contract | Surface is registered; routes arrive with account/plugins. |

`tests/architecture-boundaries.test.mjs` verifies the target directories, surface registry and dependency-direction rules. `tests/route-contracts.test.mjs` verifies ownership of critical temporary routes and that planned surfaces are not accidentally omitted.

## Required checks after each deployment

1. `/` returns HTML and has the expected favicon/metadata.
2. Workspace creation API returns a controlled response, not an unhandled error.
3. `/dashboard` renders or returns the expected authentication/workspace state.
4. `/builder` renders or returns the expected authentication/workspace state.
5. A known public site path renders published content; an unknown slug returns 404.
6. Static assets load without 5xx responses.
7. D1 binding is present for database-backed requests.

## Future surface checks

Platform Admin and POS cannot be declared product-complete during Phase 0. Their registry contracts and directory boundaries exist now; functional route checks are added in their implementation phases.
