# One Layout, Any Topic

Every playbook uses the same versioned renderer: navigation, overview, five-stage path, audience paths, curated resources, library, resource details, contribution entry, and community entry. There are no topic-specific page templates, theme generators, or dynamically invented NI illustrations.

## Light and Dark Modes

All pages, including resource details and the 404 page, support light and dark modes. The header's moon/sun button toggles the theme. Pages follow the system color preference until a visitor chooses a theme; that choice is saved in browser storage and shared across pages and tabs. If storage is unavailable, the toggle still works for the current page. The saved theme is applied before rendering to avoid a light flash.

Both palettes are defined by shared CSS variables in `platform/src/styles.css`. Platform maintainers should update the matching light and dark variables together and run `platform/browser-check.mjs` to verify both palettes. Original NI images are unchanged in either mode.

## Owner-Editable Content

Edit `playbook.json` in GitHub to customize:

- `name`, `description`, and `valueThesis`: topic and customer context.
- `overview`: section headings, supporting copy, and action labels.
- `lifecycle`: five stage names, summaries, and local library search terms.
- `outcomes`: three customer outcome labels; these are not automatically validated proof points.
- `audienceGuidance`: starting-point headings for the five standard audience roles.
- `maintainer`: content ownership.

Add resources under `resources/`. Set `featured: true` in a resource sidecar to curate an overview starting point. Titles, summaries, audiences, relationships, and HTTPS references customize content, not the page layout. Routine content edits do not require a renderer change.

```json
{
  "overview": {
    "pathsHeading": "Find Your Starting Point",
    "featuredHeading": "Recommended Resources",
    "communityHeading": "Continue the Conversation",
    "communityDescription": "Questions and implementation lessons for this topic.",
    "primaryAction": "Explore the Resources",
    "secondaryAction": "Choose an Audience Path"
  }
}
```

## NI Branding Is Shared, Not Generated

The original NI logo is copied from the exact asset URL used by the official NI website header. Its source, approval, dimensions, and SHA-256 are recorded in `platform/assets/branding.json`. Build and output validation require a byte-identical copy. Images retain their original aspect ratio, colors, and contents; no filters or crops are applied to branding.

Do not redraw an NI logo, type a substitute wordmark, invent branded icons, generate NI imagery, or copy a proprietary font without verified redistribution rights. Generic Lucide navigation/action icons are original library icons, not claimed to be NI-branded assets. An NI-branded icon can only be added from an explicitly approved original source.

Shared branding or layout changes require platform-maintainer review and a versioned platform update. Playbook owners tailor copy and content without creating a separate visual identity. Removing a resource cannot remove the shared brand asset.