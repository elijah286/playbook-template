## Start With One System

**Example-authored customer checklist.** This is a working guide, not a validated demonstration or official NI implementation guarantee.

### Prepare the First Change

1. Choose one upcoming change to a real system.
2. Record the source, runtime, drivers, licenses, and hardware dependencies.
3. Walk through the responsibilities affected by the change.
4. Agree the behavior that must remain unchanged.
5. Select a verification activity the team can repeat.
6. Retain the result and discuss what it does, and does not, establish.

### Learn the Architecture in Context

Review the Actor Framework introduction with the people who maintain the system. Connect the concepts to your own boundaries, error handling, state, and shutdown behavior. Do not migrate a stable application just because a framework is available.

### Keep an Exit and Recovery Path

Preserve a known-good source revision and environment. Rehearse recovery before depending on the new release process. Document which steps still require an engineer or physical access to the system.

### Ask the Next Question

Discuss what was hard to reproduce, what remained coupled, and who needs more context. A useful first improvement produces both evidence and better questions.