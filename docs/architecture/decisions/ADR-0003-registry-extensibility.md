# ADR-0003: Registry-driven sections, themes and plugins

- **Status:** Accepted
- **Date:** 2026-08-28

## Decision

Website sections, blocks, themes and platform plugins are self-describing packages with stable identifiers, semantic versions, manifests, defaults, compatibility metadata and migrations. Build-time discovery generates registries; adding a valid package must not require edits to a parent page, dashboard shell, router or renderer.

Plugins receive explicit permissions and controlled extension targets. They use published domain services and versioned events, not database or infrastructure imports. Arbitrary third-party server code is not supported in the initial platform.

## Consequences

- Manifest validation must fail clearly during development/build.
- Saved page documents record component type and version.
- Plugin and component failures require local error isolation.
- Registry and compatibility contracts become public architecture and require versioning.

