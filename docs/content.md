# Content and Publication Contract

## Discovery, Not a Central Index

Files under `resources/` are discovered at build time. Supported primary files are Markdown, PPTX, PDF, MP4, and JSON. A file without optional metadata receives an inferred title and ID. Binary presentation, PDF, and video text is not extracted or indexed; provide an approved title, summary, and topics for search.

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

A directory with `_bundle.json` becomes one resource whose `entry` defaults to `README.md`. Use the Markdown entry to describe the approved script, dependencies, prerequisites, source revision, limitations, and related resource IDs. Put stable HTTPS destinations in `links`. Supporting files are not silently copied: this version stages the primary file and an explicitly approved optional raster preview only. Link large packages through approved controlled storage; packaging additional bundle assets requires a reviewed extension.

`type` may be guide, presentation, document, video, reference, demonstration, or technical-project. A demonstration type is not proof that code runs. Disclose whether an item is a workshop, recorded video, or verified executable project.

Use `provenance.description`, `.url`, and `.revision` to preserve source and adaptation history. Use `reviewStatus` and `reviewDate` only for actual review evidence; do not fabricate a review date. An absent review date remains an unrecorded review, not an implicit approval.

## Security and Asset Budgets

The renderer stages only published primary files and approved previews; it never copies the resource tree wholesale. Symlinks, traversal, forbidden secret/tooling paths, unsafe URL schemes, credentials, and common signed access tokens are rejected. Archives are not automatically expanded. Rendered Markdown is sanitized; Markdown links must be HTTPS or same-page anchors.

Local primary files are limited to 25,000,000 bytes, aligned with simple browser upload needs. Raster previews are limited to 1 MB. The built search index is limited to 5 MB uncompressed and client JavaScript to 100 KB gzip. Larger videos, datasets, installers, and packages belong in administrator-approved storage with separately verified reader access. Git LFS is not part of this template.

Private is the production default. Public-demo mode requires explicit overall approval and file/folder distribution approval. Approval of a whole file includes embedded notes and hidden slides, even when the website does not extract them. Upload only content approved for that full distribution scope.

Publication states do not erase Git history, previous deployments, caches outside our control, or downloaded copies. Rebuild output is replaced, but legal retention and incident response remain owner responsibilities.