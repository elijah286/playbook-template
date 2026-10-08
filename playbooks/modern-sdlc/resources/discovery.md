## Discover the Work, Not Just the Toolchain

**Example-authored workshop guide.** Adapt the questions to the customer's constraints; the agenda is not an NI service offer.

### Before the Conversation

Ask for a system boundary diagram, the most recent change request, and the current release process. Do not ask a customer to upload confidential code into this public demo.

### Questions That Surface Risk

- What happens when the engineer who built the system is unavailable?
- Which changes are delayed because the impact is difficult to predict?
- What evidence is retained before a release is accepted?
- Which tests require real instruments, fixtures, calibration, or licensed software?
- Who decides that a change is safe, and what do they inspect?
- What must remain reproducible during the supported lifetime of the system?

### Produce a Bounded Problem Statement

Record the system, change, affected roles, constraints, and an observable acceptance condition. Separate present facts from the team's hypotheses. Assign an owner to each unknown.

| Workshop output | Example, not a result |
| --- | --- |
| Change to evaluate | Add a measurement without changing instrument coordination |
| Risk to investigate | Shared state may couple unrelated measurements |
| Verification condition | Existing measurements retain their expected behavior |
| Decision owner | Named customer engineering lead |

### Follow-Up

Choose a small architecture or verification experiment. Agree what evidence would disconfirm the proposed approach and when the team will make the next decision.