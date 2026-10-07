# Operations and Access

## Ownership and Confidentiality

The repository owner is responsible for distribution approval, maintenance, invitations, moderation, and platform adoption. Assign a named maintainer in `playbook.json`. One repository is one confidentiality boundary: readers can inspect its contents and history, including drafts. Split NI-only and partner-shareable material when their access differs.

The approved personal demo is an explicit exception: private source, publicly readable website. GitHub Pro supports public Pages from a private personal repository, but does not create access-controlled personal Pages. Personal private collaborators receive write access. This is not the production NI/partner reader model.

## Private Production Hosting Checkpoint

An administrator must create or approve an organization-owned private repository under NI governance and configure Enterprise Cloud access-controlled Pages. Validate the actual enterprise identity model, including SAML SSO and Enterprise Managed User restrictions, before promising partner eligibility.

The publisher queries the actual Pages API. Private mode requires `public: false` and an exact origin/base match. Missing Pages yields a **Blocked** summary without public deployment; public Pages in private mode fails the build. No confidential preview or public fallback is created.

After protected hosting is configured, copy its actual `html_url` origin and pathname into `playbook.json`. Test authorized, unauthenticated, unauthorized, pending-invitation, and eligible read-only partner sessions. Inspect response bodies and redirects, not only HTTP status: a 200 login page is not protected content access. Repeat for search JSON, primary binary assets, previews, technical output, and external controlled storage.

## Guided Creation

In the clean template, configure a protected `provisioning` environment and repository variables:

- `PROVISION_ALLOWED_OWNER`: explicitly approved destination owner.
- `PROVISION_ALLOWED_ACTORS`: comma-separated administrator GitHub identities.
- `PLATFORM_REPOSITORY`: approved clean template, normally `elijah286/playbook-template`.

Supply `PROVISION_TOKEN` directly in GitHub environment secrets, never through chat. Prefer an approved GitHub App or expiring least-privilege credential. It needs template read access, target repository creation/administration, content/workflow writes, Issues label setup, Discussions setup, and explicit Actions dispatch on the authorized destination. Do not give it to content-processing jobs. Production credential permissions and organization policies require administrator review.

Run **Create New Playbook** with any topic, value thesis, lowercase repository name, and a stable unique request ID. The script creates private source only, detects naming collisions, binds retries to the same request inputs, preserves existing content, enables separate Discussions, initializes owner-specific configuration, and explicitly dispatches the first build. If initial template content is not yet ready, retry the same request ID. If protected Pages is absent, hosting remains blocked; configure it and retry. The workflow never invites users, changes an existing repository's visibility, deletes a target, or executes contributed projects.

## Collaborators and Discussions

Use **Settings > Collaborators/Manage access** to invite named users or approved teams. Obtain identity-specific approval before inviting anyone. Confirm acceptance and required SSO separately from sending an invitation. Verify repository and website access after acceptance. Revoke through the same settings, retest clean sessions, and account for downloaded copies that cannot be recalled.

Production roles should separate readers, contributors, and administrators. An eligible read-only organization member must be tested for Discussions participation without granting write access. The personal demo's write-access limitation is disclosed and approved; do not silently apply it to production.

Discussions is repository-native and private with the source repository. Default categories can be curated into Announcements, Q&A, Technical Examples, and Feedback/Lessons Learned through GitHub's administrator UI. Direct links avoid browser credentials and confidential live-feed leakage. Assign moderators and a welcome thread for each instance; do not copy reference discussions into new playbooks.

## Publishing and Failure Safety

`main` is the publishing branch. Dependency locking, immutable action pins, timeouts, shared concurrency, build validation, asset identity checks, and a current-main revision check precede deployment. Build scripts have no provisioning credential. A required failure prevents Pages deployment and preserves the last successful site. Draft-PR validation produces no website deployment.

Protect `platform/`, workflow files, package manifests, Astro config, and the branding inventory through approved CODEOWNERS/branch or ruleset policy. The repository owner must configure the actual enforcement; a file alone is not a security control. No protection bypass or universal editorial approval is imposed by this demo.

## Shared Versions and Rollback

All topics use the same platform files. For **Adopt Shared Platform**, configure a protected `platform-updates` environment and an approved `PLATFORM_UPDATE_TOKEN` with source read plus target contents/PR/Actions permissions. Supply an exact reviewed 40-character source commit. The workflow creates a reviewable PR and explicitly dispatches validation; it cannot replace `playbook.json`, resources, README, or instance docs. Original brand assets use base64 Git Blob transfer without conversion. A recorded lock detects local renderer modifications before overwrite.

Review dependency/workflow changes and run instance checks before merging. To roll back, use a normal revert of the platform adoption commit or merge, preserving later content commits. A content rollback is a separate normal revert. Do not reset or force-push history to recover a deployment. Live adoption/rollback is not certified until tested in an approved instance.

## Maintenance and Analytics

Use resource `owner`, `reviewStatus`, and actual `reviewDate` to maintain an actionable review inventory. **Review Links and Content** runs weekly and on explicit dispatch. It updates one consolidated private issue, checks at most 100 unique HTTPS destinations, retries network/server failures once, stops on rate limits, and flags unrecorded, invalid, future, or stale review dates without changing publication.

Default approved hosts are `www.ni.com`, `ni.com`, `ni.github.io`, and `github.com`. Administrators can set literal `maintenance.allowedHosts` after reviewing destinations. Unapproved hosts are not fetched. DNS addresses must all be public unicast and the validated address is pinned to the HTTPS connection. Redirects are bounded and each destination is rechecked; no cookies, tokens, or credentials are sent externally. HEAD reachability is not proof of useful content or reader authorization. Authentication/policy, unsupported HEAD, GitHub private/not-found, transient, and rate-limit states remain distinct maintenance warnings, not website deployment gates. Review product recommendations and partner claims with their actual owners.

Analytics is disabled; the browser check records zero third-party requests. No service worker/offline cache, GitHub browser token, analytics vendor, or public audit service is installed. Enabled analytics is deliberately blocked until the destination, approved fields, retention, consent policy, and adapter are separately approved and tested. Do not record identities, raw search terms, customer names, sensitive titles, replay, or fingerprinting. Download clicks are not completed downloads; Discussions clicks are not participation.