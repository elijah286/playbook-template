# Content and Publication Contract

## Discovery, Not a Central Index

When `hub.json` exists, published folders under `playbooks/` are discovered at build time. Each contains `playbook.json` with `name`, `valueThesis`, optional `description`, `maintainer`, `featured`, `overview`, `audienceGuidance`, and `status`. Hub-wide repository, site, publication, asset, and analytics settings cannot be overridden by a playbook. Public-demo playbooks require explicit `publicApproved: true` as well as individual resource distribution approval.

Each playbook owns `resources/`. Optional `sharedResources: ["stable-id"]` includes published resources from `shared/resources/`; unreferenced shared resources are not staged. Local resource IDs may repeat across playbooks: global IDs and asset filenames are namespaced, while scoped resource URLs retain local IDs. Related shared resources use `shared--stable-id` and must also be explicitly included. The reserved playbook slug `shared` is rejected. Folder names, tags, and ownership never create access boundaries.

Legacy instances without `hub.json` continue discovering the root `resources/` with their root `playbook.json`. For migration, move the existing resource tree into one playbook folder, remove hub-level settings from that playbook's configuration, and set `legacyResourceRoutes: true` on that one playbook to preserve old resource pages and primary/cover asset links. Only one playbook can own legacy routes. The root overview becomes the directory; library/audience links remain available at the hub.

Supported primary files include Markdown, PPTX, PDF, MP4, JSON, TXT email templates, and approved text-based source/project formats. A file without optional metadata receives an inferred title and ID. Binary presentation, PDF, and video text is not extracted or indexed; provide an approved title, summary, and topics for search.

Metadata precedence is inferred defaults, inherited `_folder.json`, `<filename>.resource.json`, then `_bundle.json`. Missing optional metadata is allowed. Invalid IDs, relationships, unsafe links, oversized files, or security settings block publication with the resource path or ID.

```json
{
  "id": "architecture-overview",
  "title": "Architecture Overview",
  "summary": "A distribution-approved description.",
  "categories": ["fae-enablement"],
  "audiences": ["fae", "partner", "customer"],
  "status": "published",
  "owner": "content-owner",
  "topics": ["architecture"],
  "outcomes": ["maintainability"],
  "relatedResources": [],
  "aliases": [],
  "featured": false,
  "publicApproved": false
}
```

Use stable explicit IDs before linking a resource externally. Inferred IDs change when a file moves or is renamed. `aliases` preserve old detail URLs through redirects; aliases and IDs cannot collide.

## Categories and Audiences

Eight categories are always available: value-thesis, discovery, sales-sbm, fae-enablement, customer-success, partner-enablement, partner-references, and customer-enablement. Five audience keys are sales, fae, customer-success, partner, and customer. These organize content; they are not permission boundaries.

## States, Bundles, and References

`published` is the default. `draft` and `archived` resources do not enter pages, search, related links, or copied assets. Links to an unpublished resource block the build rather than creating a broken link.

A directory with `_bundle.json` becomes one resource whose `entry` defaults to `README.md`. Describe the approved source, dependencies, prerequisites, revision, limitations, and related resources in that entry. Put stable HTTPS destinations in `links`. A `files` list explicitly publishes supporting text/source files relative to the bundle folder; each is checked for containment, forbidden paths, symlinks, and a 1 MB budget. The entire bundle remains within the primary asset budget. Source is displayed as escaped text, with copy and individual download actions, and is never executed. Other supporting files are not silently copied; binary project packaging needs a separately reviewed extension.

`type` may be guide, presentation, document, video, reference, demonstration, technical-project, or email-template. A TXT email template is displayed as plain text with a copy action. Markdown email templates also support copying their original source. A video can be a Markdown resource with `type: video` and an approved external `links` destination; no external player is silently embedded. A demonstration type is not proof that code runs. Disclose whether an item is a workshop, recorded video, or verified executable project.

Use `provenance.description`, `.url`, and `.revision` to preserve source and adaptation history. Use `reviewStatus` and `reviewDate` only for actual review evidence; do not fabricate a review date. An absent review date remains an unrecorded review, not an implicit approval.

## Presentation Previews

Published PPTX files automatically generate a cover, ordered slide images, and a thumbnail strip at build time. PDF files do the same when their metadata sets `type: presentation`. A supplied `preview` image can override the cover; it does not replace the slide images. Resource cards open an in-place slide browser, including after library searches and filters. The original download remains available without JavaScript.

LibreOffice renders PPTX to a temporary PDF; Poppler creates 1440-pixel slide images and 320-pixel thumbnails. Speaker notes and hidden PPTX slides are excluded from previews, not from the original download. Preview fonts, animations, and layout may differ from PowerPoint; use the original for presenting. No slide text is added to search.

Previews are bound to the original file's SHA-256 and published only for resources admitted by discovery. Temporary PDFs and office profiles are removed. The CI converter runs in a non-root, read-only Docker container without network access or build credentials, with memory, CPU, process, and execution-time limits. Build the local container with `docker build -t playbook-preview-renderer -f platform/preview-renderer.Dockerfile platform` and set `PLAYBOOK_PREVIEW_RENDERER=docker` to use the same sandbox. Native local conversion requires LibreOffice and Poppler and should only be used with trusted files.

Each presentation supports up to 150 visible slides, 1 MB per image, and 25 MB of combined slide/thumbnail assets. Conversion errors or excess budgets block the build and leave the last successful deployment intact. Split oversized decks or use approved controlled storage.

## Security and Asset Budgets

The renderer stages only published primary files and approved previews; it never copies the resource tree wholesale. Symlinks, traversal, forbidden secret/tooling paths, unsafe URL schemes, credentials, and common signed access tokens are rejected. Archives are not automatically expanded. Rendered Markdown is sanitized; Markdown links must be HTTPS or same-page anchors.

Local primary files are limited to 25,000,000 bytes, aligned with simple browser upload needs. Raster previews are limited to 1 MB. The built search index is limited to 5 MB uncompressed and client JavaScript to 100 KB gzip. Larger videos, datasets, installers, and packages belong in administrator-approved storage with separately verified reader access. Git LFS is not part of this template.

Private is the production default. Public-demo mode requires explicit overall approval and file/folder distribution approval. Approval of a whole file includes embedded notes and hidden slides, even when the website does not extract them. Upload only content approved for that full distribution scope.

Publication states do not erase Git history, previous deployments, caches outside our control, or downloaded copies. Rebuild output is replaced, but legal retention and incident response remain owner responsibilities.