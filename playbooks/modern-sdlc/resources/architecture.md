## Choose Boundaries Before Choosing a Framework

**Example-authored technical guidance.** The original Actor Framework presentation provides a starting point for discussion, not a prescription for every system.

### Responsibilities to Separate

Identify hardware access, measurement behavior, coordination, user interaction, persistence, and error handling. A module should make one responsibility understandable without requiring knowledge of the entire application.

### Inspect a Real Change

Walk through adding a measurement, replacing an instrument, and stopping the application after a fault. Record which components change and how messages, state, and lifetime are managed.

### Questions for an Architecture Decision

- What needs independent lifetime or concurrency?
- Where is state owned, and who may change it?
- How are messages ordered, errors propagated, and shutdown completed?
- Which interfaces can be exercised without hardware?
- How will a new engineer diagnose a failed system?
- Does the team understand the chosen framework well enough to maintain it?

### Actor Framework as One Option

Actor Framework supports actor-oriented application design in LabVIEW. Its fit depends on the system's coordination requirements and the team's knowledge. Review the original presentation and current NI documentation before choosing it. Compare alternatives against the same change scenarios instead of relying on a framework popularity ranking.

### Record the Decision

Keep the context, alternatives, decision, consequences, and revisit conditions in a short architecture decision record. Attach the evidence used in the choice. A decision that cannot be revisited becomes another hidden dependency.