# Section modules

Add one `.tsx` file to this directory. The builder discovers it automatically; do not edit the registry, builder, public renderer, or page templates.

Every default export must satisfy `SectionDefinition` and include a unique `type`, `version`, editable `fields`, `defaults`, a component, and at least one `preset`. Sections without presets are intentionally hidden from the Add section picker. Use `enabledOn` only when a section is limited to `store`, `services`, or `portfolio` businesses.

Never depend on the generated instance `id`. Treat saved settings as backwards-compatible data and increment `version` when the module evolves.
