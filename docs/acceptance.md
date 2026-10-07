# Acceptance Evidence

Status meanings: **Passed**, **Failed**, **Blocked**, and **Not Run**. This is a template baseline, not certification of a new instance. The separately approved reference has its own report. A public personal Pages demo does not satisfy enterprise-private acceptance.

## Recorded Local Evidence

- Node 22.22.0 / npm 10.9.4; exact dependency lock; dependency audit reported zero vulnerabilities after updating to Astro 7.3.6.
- 24 unit tests passed for discovery, upload inference, approval/state handling, metadata precedence, identifiers/relationships, paths/symlinks, bundles, URLs, 200-resource discovery, arbitrary-topic copy, original branding, provisioning allowlists, submission permissions, update ownership, internal-network checks, and review dates.
- Empty clean-template build and output verification passed with zero resources.
- Shared browser implementation was tested on the separate reference at 375, 768, 1024, 1440, and 1920 pixels. Repeat `platform/browser-check.mjs` for each instance's actual content, routes, identity model, and asset access; this template does not include the reference's screenshots or content.
- Analytics is disabled by default. Browser evidence belongs in ignored `.generated/evidence/`, not public output.
- Browser and automated evidence do not by themselves establish WCAG 2.2 AA conformance; full assistive-technology/manual review and field performance are not claimed.

## Scenario Status

| Scenario | Status | Evidence or remaining gate |
| --- | --- | --- |
| Instance topic/content approval | Not Run | Obtain instance-specific distribution approval and record provenance; the template contains no topic resources |
| Clean template | Passed | Zero-resource build; reference root ignored and separate; shared NI asset inventory contains only explicitly approved original branding |
| Arbitrary topic without renderer changes | Passed locally | Cryogenic measurement configuration and 200 synthetic resources tested outside published content; no second live test repository created |
| Independent live arbitrary-topic instance | Not Run | Requires explicit test-repository creation approval and configured provisioning/hosting credentials |
| Protected production access and direct bytes | Blocked | Needs enterprise organization Pages, identity policy, authorized/unauthorized clean sessions, and controlled external-asset tests |
| Read-only partner browse/Discussions | Blocked | Personal repositories only offer collaborator write access; production organization eligibility must be verified |
| Basic browser upload publication | Not Run end to end | File discovery passes without a central index; live browser upload/deploy still requires an approved upload drill |
| Structured request conversion | Passed locally | Both submitter and approver permissions required; stable draft output and unsafe/incomplete rejection; live conversion/merge/dispatch Not Run |
| Demonstration relationships | Not Run | Requires approved instance-specific media, script, dependencies, source, and related resources |
| LabVIEW output coexistence/correctness | Blocked | No approved compatible project, verified artifact-only toolkit contract, runner/license, or generated output; no second publisher or phantom controls installed |
| Resource update/removal/draft assets | Not Run end to end | Local state/relationship tests and exact staged-asset verification pass; live removal and failure-preservation drills still needed |
| Provisioning collision/partial-state/retry | Not Run end to end | Local allowlist/name/request identity tests pass; live collision, partial-failure, and retry drills require approved target/credentials |
| Shared update preserving content | Not Run end to end | Ownership and unsafe-entry tests pass; live adoption and rollback still require an approved instance |
| Original NI branding | Passed | Official source approval, checksum gate, byte-identical output, browser aspect-ratio/filter checks; fabricated mark/artwork removed |
| Responsive and keyboard checks | Not Run for a new instance | Run the supplied browser suite and review actual topic copy at all five viewports |
| Accessibility | Not Run for a new instance | Run axe and manual keyboard/assistive-technology review against actual content |
| Lighthouse 95+ and lab metrics | Not Run | Representative controlled static build needs local Lighthouse run; field INP cannot be claimed from a lab score |
| Analytics disabled | Passed by implementation | No analytics adapter or third-party scripts; repeat the zero-request browser check per instance |
| Analytics enabled approved events | Blocked | Approved service, fields, retention, consent policy, and tested adapter not available |
| Scheduled consolidated maintenance | Passed locally | Safe-IP, approved-host, and date tests; weekly workflow updates one issue; new instances must verify an actual run |

## Live Rollout

The source template is private and marked as a template. It has no website publication or reference resources. Initialize this report with the new instance's actual repository, verified private Pages URL, Discussions, identities, content approvals, and deployment evidence. Do not copy reference-specific approval or invitations. No collaborators have been invited by this template.

The production platform remains incomplete until the blocked enterprise/private-access and real technical-integration gates are verified. Do not label this public reference demonstration as production-certified.