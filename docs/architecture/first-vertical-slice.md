# First replacement vertical slice

## Outcome

A public user creates one of four workspace types, opens a capability-aware merchant dashboard, creates a page, adds an automatically discovered section, saves a draft, publishes it, and views the published site through the public resolver.

## Sequence

| Step | Owning phase | Replacement work | Verification |
|---:|---:|---|---|
| 1 | 1 | Workspace type and capability preset | Four presets create valid workspaces; repeated request is idempotent. |
| 2 | 1–3 | Merchant application context and dashboard | Correct workspace and capability-aware navigation load. |
| 3 | 4 | Site, page and version services | Page draft is tenant-scoped and versioned. |
| 4 | 5 | Component manifest discovery | A new valid package appears without parent-file changes. |
| 5 | 6 | Editor save and preview | Refresh restores draft; preview does not publish. |
| 6 | 4–6 | Atomic publish operation | Published pointer changes only after validation succeeds. |
| 7 | 4 | Storefront resolver | Slug/domain returns only the published version. |
| 8 | 0–6 | Migration and cutover | Existing page is migrated; old route/component removed after parity. |

## Cutover rules

- Keep the current `/`, `/dashboard`, `/pages`, `/builder` and `/s/{slug}` flows until their replacement step passes.
- Route URLs may remain stable while their implementation moves to the new boundary.
- Do not add commerce or POS behaviour to this slice.
- Delete compatibility code immediately after the new path and data migration are verified.

