# Third-party notices

MyTask's original code is distributed under the root [MIT License](LICENSE).
Third-party code retains its original copyright and license. The root license
does not replace these notices.

| Included code | Copyright | License text |
| --- | --- | --- |
| `build/sites-vite-plugin.ts`, supplied with the Sites scaffold | Copyright (c) 2026 OpenAI | [MIT](build/sites-vite-plugin.LICENSE) |
| shadcn UI registry components in `components/ui/` and the registry hook in `hooks/use-mobile.ts` | Copyright (c) 2023 shadcn | [MIT](vendor/shadcn-ui.LICENSE) |
| `vendor/shadcn-tailwind-4.13.0.css` | Copyright (c) 2023 shadcn | [MIT](vendor/shadcn-tailwind-4.13.0.LICENSE.md) |

The supplied Sites and connector adapters are retained with the source so their
platform-specific behavior can be inspected. MyTask is an independent project;
it is not an official OpenAI or ChatGPT product.

Dependencies listed in `package.json` and `pnpm-lock.yaml` are installed from npm
and remain subject to their respective licenses. Dependency source, binaries and
`node_modules` are not included in the project's source or extension archives.
When distributing a bundled application, inspect the installed dependencies
with `pnpm licenses list` and include any notices required by those dependencies.

ChatGPT, OpenAI and other product names belong to their respective owners. MIT
licensing of this repository does not grant rights to third-party trademarks or
access to third-party services.
