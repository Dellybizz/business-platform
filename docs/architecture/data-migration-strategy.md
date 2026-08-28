# Data migration strategy

## Principles

1. Never edit or reorder an applied migration.
2. Back up the production D1 database before structural or destructive migrations.
3. Prefer expand → backfill → verify → switch reads/writes → contract.
4. Every migration is restart-safe or records a resumable checkpoint.
5. Tenant ownership is validated during backfill.
6. Unknown or invalid legacy records are quarantined, not discarded.
7. Destructive cleanup occurs in a later release after verification and rollback time.

## Baseline

The existing Drizzle migrations `0000` through `0005` are historical prototype migrations. They remain immutable. The current schema contains users, workspaces, memberships, domains, pages, generic content items and submissions.

Phase 0 does not change production tables. New domain migrations begin only in the phase that owns the domain.

## Migration sequence

### 1. Expand

- Add new normalized tables and nullable compatibility columns.
- Add indexes and uniqueness constraints only after duplicate analysis.
- Leave legacy tables and reads operational.

### 2. Backfill

- Map workspace `mode` values to workspace type/capability presets.
- Create one Site for each workspace with existing pages/domains.
- Convert every legacy page into an initial versioned page document.
- Classify `content_items.kind` into product, service or portfolio data.
- Move submissions into forms/submissions/contacts while retaining legacy IDs.

### 3. Verify

- Compare record counts by workspace.
- Compare canonical field values and page payload hashes.
- Confirm every migrated child resolves to a valid workspace-owned parent.
- Run route and tenant-isolation tests against migrated fixtures.
- Produce a migration report containing migrated, skipped and quarantined IDs.

### 4. Switch

- Move writes to domain services/new tables.
- Temporarily dual-read only where a rollback window requires it.
- Switch public rendering after published-version parity checks.

### 5. Contract

- Stop legacy writes.
- Remove compatibility adapters and old routes.
- Drop old tables only after backup, verification and an explicit destructive migration review.

## Rollback

- Application releases must be independently reversible while both old and expanded schemas exist.
- A failed backfill is rerun from its checkpoint after correction.
- After contract/drop migrations, rollback uses the verified pre-migration backup plus the previous application release.

## Production procedure

1. Record deployed commit and migration journal.
2. Export/backup D1.
3. Run migrations once through the canonical deployment command.
4. Run migration verification queries.
5. Deploy application code compatible with the expanded schema.
6. Run the production smoke matrix.
7. Record outcome and retain backup according to the recovery policy.

