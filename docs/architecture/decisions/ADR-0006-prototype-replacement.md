# ADR-0006: Controlled replacement of the prototype

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

The current application proves deployment, basic workspace creation, page editing and public rendering, but its generic data model and coupled route/component structure are not the permanent platform architecture.

## Decision

Treat current platform code as a replaceable prototype. Classify each area as reuse, migrate or replace. Preserve unrelated user work and valuable production data, but do not preserve an incompatible abstraction only because it exists.

Replace the prototype by verified vertical slices. Keep the old flow available where practical until its replacement passes tests, migrate valuable data, switch routes, then remove obsolete code and tables.

## Consequences

- A large one-shot rewrite is avoided without freezing the prototype design.
- Compatibility adapters must have an owner and deletion phase.
- Old routes and tables are removed promptly after migration verification.

