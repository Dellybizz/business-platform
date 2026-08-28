# Application surfaces

Each child directory owns routing, layouts and view composition for one application surface. Application code may call domain services and shared UI. It must not contain a duplicate commerce or website data model.

The `surfaces.ts` contract is deliberately non-visual in Phase 0. Real routes move into these boundaries in later phases through verified vertical slices.

