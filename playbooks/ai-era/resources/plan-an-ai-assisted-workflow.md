# Plan an AI-Assisted Workflow

## Start With a Reviewable Outcome

Choose one bounded task: drafting a customer email, documenting an existing design, proposing test cases, or reviewing a text-based change. Record the current effort, the desired improvement, and who will check the result.

## Prepare Approved Context

Use only material approved for the chosen AI service and the customer engagement. Describe the relevant NI product version, operating environment, interfaces, and constraints. Remove secrets, personal data, and confidential customer details unless the approved service explicitly permits them.

## Define the Evidence

Ask the model to separate verified facts from assumptions and proposed changes. Require references for product-specific claims. Treat generated code, explanations, and configuration as proposals, not proof of compatibility.

## Review and Verify

Inspect the result with the responsible engineer. Run relevant checks in the actual supported NI environment before making an execution or performance claim. Do not infer that AI can safely generate or modify a LabVIEW artifact merely because it can explain the intended behavior.

## Close the Loop

Compare the review and verification effort with the original task. Retain the useful prompt, approved context, and evidence. Share limitations and failures as well as successful examples.

This is an original planning guide, not a certification of an AI integration or a claim that any specific NI product supports a particular assistant.