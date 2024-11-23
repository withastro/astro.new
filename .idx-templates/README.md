# `.idx-templates`

This directory contains [custom templates](https://developers.google.com/idx/guides/custom-templates) for the IDX cloud development environment.

There is a template each for Astro's `latest` and `next` branches.

## Template structure

Each template contains the following files:

- `dev.nix` — a Nix configuration for the packages in the dev environment, setup commands to run, etc.
- `icon.png` — the Astro logo, used in IDX’s user interface.
- `idx-template.json` — configuration for the modal IDX shows when launching the template. This is kept in sync with templates from the Astro monorepo with the `pnpm generate:idx` script.
- `idx-template.nix` — a Nix configuration for how to scaffold a new project. This runs `create astro` silently under the hood.
- `README.md` — IDX links to the template folder from its launcher, so this is a minimal welcome for visitors from that flow.
