[Modern SDLC Reference Repository](https://github.com/elijah286/modern-sdlc-playbook)

# Customer Value Playbook Template

A clean, reusable playbook with one shared layout, original approved NI branding, and topic-specific content. The populated Modern Software Development Lifecycle example lives in a separate repository, not this template's content or history.

## Create Your Playbook

Use **Use this template** to create a **private** repository. Customize the title, customer value thesis, overview copy, five stages, three outcome labels, and audience guidance in `playbook.json`. Add your distribution-approved resources under `resources/`; you do not need to maintain a central resource index.

For administrator-assisted creation, use **Actions > Create New Playbook** after configuring the approved target owner, actor allowlist, and separate provisioning credential. Any topic is supported. A new instance stays private and cannot deploy until access-controlled hosting is configured and verified. It has its own library, search, repository permissions, and Discussions.

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