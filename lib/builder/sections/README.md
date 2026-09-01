# Component package contract

Add one `.tsx` file or a folder containing `index.tsx`. The builder discovers it automatically; do not edit the registry, builder, public renderer, or page templates. Blocks and globals follow the same contract in their respective directories.

Every default export must satisfy its typed manifest and include a unique kebab-case `type`, `kind`, positive `version`, editable `fields`, scalar `defaults`, a component, and at least one `preset`. Invalid manifests stop the build with the source path. Use `enabledOn` for service-specific starters.

Never depend on the generated instance `id`. Treat saved settings as backwards-compatible data, increment `version` when the module evolves, and supply sequential migrations. Unknown component data is preserved and render failures are isolated.
