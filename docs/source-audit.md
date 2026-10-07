# Source and Integration Audit

## Inventory Each Instance Before Publication

This clean template contains no topic-specific source material. Each playbook owner must record the approved topic, source repository/file, immutable revision, owner, license or specific distribution approval, adaptation, intended audience, and limits. Read access alone is not redistribution approval.

Review the actual source before describing it. For presentations, disclose notes and hidden slides included in the original download; do not index that material without separate approval. Record binary SHA-256 so copied source can be verified. Distinguish newly authored example guidance from official NI commitments, measured results, customer quotes, and partner endorsements.

## Shared NI Assets

The owner explicitly approved exact official NI website assets on 2026-10-07. The common logo comes from the URL used by the official NI homepage header, copied without transformation. `platform/assets/branding.json` records the source and checksum. Build validation rejects altered bytes. Generic utility icons are original Lucide library assets, not invented NI-branded icons. No proprietary NI font has been redistributed and no new NI imagery is generated.

## Access and Review Gates

Verify NI organization access and SAML SSO before reading internal sources. Do not copy confidential content into a public demo or public preview. Defer material containing unreviewed technical claims, licensing uncertainty, broken source paths, or unverified dependencies. Record those gaps in the instance's own inventory instead of inheriting another playbook's source approvals.

## LabVIEW Toolkit Review

Canonical destination: [NI LabVIEW CI/CD Toolkit](https://github.com/ni/LabVIEW-CI-CD-Toolkit), with [public documentation](https://ni.github.io/LabVIEW-CI-CD-Toolkit/documentation.html). The reviewed catalog identified main 4.18.4 and stable 4.16.3; these are audit observations, not execution pins. Reported capabilities include compile, analysis, diffs, snapshots, tests, documentation, builds, and SBOM. Unit-test execution has platform constraints; qualified LabVIEW versions, runner images, dependencies, licensing, and installation must be verified for the actual project.

The reviewed reusable workflow retains predecessor references and floating major/image inputs and can publish directly to `gh-pages`. An artifact-only contract has not been verified. Antidoc output may use Kroki; data egress requires explicit approval. The installer has therefore not been run, upstream repositories are unchanged, and there is no second Pages publisher.

## Integration Gate, Not a Fake Source Browser

No compatible approved technical project or generated toolkit artifact is available in this instance. Source-exploration UI and executable-demo certification remain **Blocked**. The site does not show unavailable source/report controls or stale generated results as current.

Before implementing and enabling the smallest upstream-supported collector, verify:

1. An approved real project, source/dependency identity, supported environment, license, and runner.
2. An immutable toolkit revision and artifact-only generation path with isolated credentials.
3. A bounded artifact manifest containing project ID, input identity, source revision, toolkit version, status, and safe output paths.
4. Correct links, scripts, styles, JSON, images, and return paths under the actual Pages base.
5. Cache reuse only for matching source/dependency identity, with explicit last-known-good labeling otherwise.
6. One final playbook artifact and one deploy job; upstream output must not overwrite it.

Do not fabricate `.vi` or `.seq` files, expand untrusted archives, run contributed projects with provisioning credentials, or claim local simulation proves enterprise access.