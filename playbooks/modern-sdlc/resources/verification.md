## Make Verification and Delivery Repeatable

**Example-authored guidance.** No LabVIEW runner, license, hardware fixture, or generated report has been verified in this reference instance.

### Build an Evidence Ladder

Start with checks that are inexpensive and deterministic. Keep hardware-dependent verification explicit rather than pretending a desktop-only test covers the complete measurement system.

| Layer | Useful evidence | Environment to record |
| --- | --- | --- |
| Static inspection | Analysis findings and reviewed exceptions | Tool and rule versions |
| Isolated logic | Repeatable input/output checks | Source, dependencies, runtime |
| Integration | Module interaction and error-path behavior | Instrument substitutes and configuration |
| Hardware verification | Behavior under representative physical conditions | Fixtures, drivers, calibration, limits |
| Release acceptance | Agreed requirements and retained approvals | Build identity and decision owner |

### Define a Release Identity

Retain the source revision, dependency versions, LabVIEW/runtime version, build inputs, and verification outcomes. Preserve failures as evidence; do not convert an unsupported check into a success.

### Evaluate Automation Carefully

The public [LabVIEW CI/CD Toolkit](https://ni.github.io/LabVIEW-CI-CD-Toolkit/documentation.html) is a candidate for compile, analysis, documentation, testing, and build automation. This playbook has not installed its execution workflows. Runner compatibility, licenses, dependencies, version pins, data egress, and artifact paths must be validated first.

The playbook uses a single website publisher. Toolkit source views and reports must enter that publisher as revision-bound artifacts rather than deploying a second site over it.

### Start Small

Choose one change, one check, and one retained result. Measure how repeatable the check is before relying on it as a release gate. Expand only after the environment and failure behavior are understood.