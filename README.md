[Open Customer Value Playbooks](https://elijah286.github.io/playbook-template/)

# Customer Value Playbooks

A self-contained public demonstration of the multi-playbook hub, with original approved NI branding and independently organized AI and Modern SDLC resources. This repository owns its content, assets, publisher, and Discussions. The owner explicitly approved this populated public demonstration; it is not the protected NI website.

## Manage This Hub

Collection identity, publication approval, ownership, and the actual hosting URL live in `hub.json`. Each topic folder under `playbooks/` owns its `playbook.json` and `resources/`. Published playbooks are discovered automatically; no central catalog edit is required. This populated hub is no longer an empty template for repository generation.

Use **Actions > Add Playbook to Hub** to prepare a draft PR with a configuration and typed resource folders. Review the purpose and audience, add approved materials, and change `status` to `published` before merging. All playbooks share the hub's reader access and Discussions. Hub search spans the collection; each playbook has a scoped library, audience paths, contribution entry, and compact resource-first overview.

Resources are normally owned by their playbook. Optional `sharedResources` references include reusable files from `shared/resources/` by stable ID, without duplicate downloads or index records. Email templates, guides, code bundles, slide previews, and linked videos use the same publishing pipeline. See the [content contract](docs/content.md).

For a separate confidentiality boundary, provision from an independently maintained clean template after administrator approval. **Create New Playbook** deliberately refuses a populated source such as this hub. A separate private instance cannot deploy until access-controlled hosting is configured and verified. Legacy instances with only a root `playbook.json` and `resources/` remain supported.

- [Owner Customization](docs/customization.md)
- [Browser Contribution Guide](docs/contributing.md)
- [Administrator Setup and Access](docs/operations.md)
- [Content Rules and Publication](docs/content.md)
- [Source and Technical Integration Audit](docs/source-audit.md)
- [Acceptance Evidence and Blockers](docs/acceptance.md)

## Local Development

Node 22.22.0 and npm 10.9.4 were used for validation. Install a compatible Node version before running:

```sh
npm ci
npm test
npm run validate
ASTRO_TELEMETRY_DISABLED=1 npm run build
node platform/verify-build.mjs
ASTRO_TELEMETRY_DISABLED=1 npm run dev
```

The default preview is `http://127.0.0.1:4321/`. Browser checks run locally with `npx playwright install chromium` followed by `node platform/browser-check.mjs`. Configure `SITE_URL` when the instance has a different local base path. Screenshots and audit reports stay in ignored `.generated/evidence/`, never in public Pages output.

Presentation conversion needs LibreOffice and Poppler for trusted local files. On macOS, install with `brew install --cask libreoffice` and `brew install poppler`. For the isolated CI-equivalent path, build `platform/preview-renderer.Dockerfile` as `playbook-preview-renderer` and set `PLAYBOOK_PREVIEW_RENDERER=docker`; Docker must be running. An independent local Astro server can use `--ignore-lock --port 4330`. Set `PLAYBOOK_ROOT` explicitly for an external content collection; clear it before checking the clean template.