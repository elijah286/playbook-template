# Browser Contribution Guide

## Upload a Presentation

Open the website's **Contribute > Upload in GitHub** link. Choose an original PPTX or PDF under the local file budget, write a useful commit message, and commit to `main` when repository policy permits. A push automatically queues validation and publication; it is not instantaneous and does not bypass security checks. Watch **Actions > Publish Playbook** for errors and the deployment result.

Optional: add `your-file.pptx.resource.json` beside the file to set a title, summary, audiences, categories, stable ID, relationships, and owner. Folder defaults make a basic upload discoverable without a central-index edit.

For the public reference demo, its presentation folder is distribution-approved. Every committed presentation in that folder becomes publicly downloadable after a successful build, including notes and hidden slides. Do not upload confidential NI/customer material there.

## Add or Edit Narrative Guidance

In GitHub, open `resources/guides/` and use **Add file > Create new file** for a `.md` document. Use headings, paragraphs, lists, and HTTPS references. Add a sidecar when you need additional metadata. Preview and commit the change. Unsupported scripts/HTML are not retained by the Markdown sanitizer.

For a success plan, use the same Markdown workflow and choose category `customer-success`. Keep milestones, owners, acceptance evidence, and unresolved questions accurate. Customer-specific confidential plans require a different protected repository from the public demo.

## Request Structured Content

Open **Issues > New issue > Resource Request**. The form creates a request, not website content. An authorized writer may apply `approved-resource`; automation checks both the original submitter and approving actor's current repository permissions before writing anything.

Eligible requests become a draft pull request and an explicitly dispatched validation run. Review content and distribution rights, change `status` to `published`, record public approval when appropriate, mark the PR ready, and merge it. The merge push triggers publication. Reader requests are not converted into repository writes. The workflow needs GitHub's permission to create pull requests; an administrator must enable that policy or provide an approved app-based alternative.

## Add a Video or Reference

Create a short Markdown or JSON resource and use `links` for stable HTTPS destinations. Record the storage owner, version, audience access requirements, prerequisites, size when known, and maintenance responsibility in the description. Do not embed tokens, signed download URLs, or an unapproved external player. No paid hosting or analytics service is provisioned.

## Add a Workshop, Demo, or Technical Project

Create a directory with `README.md` and `_bundle.json`. The README is the single resource entry. Describe the activity honestly; link the original approved source, script, package/video, dependencies, and related resources. A type label does not certify an executable demonstration.

This version does not execute LabVIEW code or publish a source browser. Do not invent VI/SEQ files or expose an **Explore Source** link without verified output. Follow the [Technical Audit](source-audit.md) before installing a compatible artifact-only integration.

## Update or Remove Content

Edit the original file/sidecar in GitHub and commit. To unpublish, set `status: draft` or `archived` and remove incoming relationships. To delete, remove the primary file and its metadata. The next successful build excludes the page, search record, and staged file. A failed build leaves the last successful deployment intact.