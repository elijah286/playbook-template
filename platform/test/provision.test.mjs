import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { provisionRequest } from '../provision.mjs';
import { playbookDraft } from '../add-playbook.mjs';

const inputs = { owner: 'approved-org', repository: 'cryogenic-measurements', name: 'Cryogenic Measurement Strategy', value_thesis: 'Retain trustworthy evidence across fixture changes.', request_id: 'request-2026-001' };
const policy = { owner: 'approved-org', actors: ['administrator'] };
test('an arbitrary topic produces a deterministic private provisioning request', () => {
  const first = provisionRequest(inputs, policy, 'administrator');
  assert.deepEqual(first, provisionRequest(inputs, policy, 'administrator'));
  assert.equal(first.target, 'approved-org/cryogenic-measurements');
  assert.notEqual(first.inputIdentity, provisionRequest({ ...inputs, name: 'Another topic' }, policy, 'administrator').inputIdentity);
});
test('unapproved owners and actors cannot provision', () => {
  assert.throws(() => provisionRequest(inputs, policy, 'reader'), /allowlisted/);
  assert.throws(() => provisionRequest({ ...inputs, owner: 'other-org' }, policy, 'administrator'), /allowlisted/);
  assert.throws(() => provisionRequest(inputs, { ...policy, owner: '' }, 'administrator'), /allowlisted/);
});
test('unsafe names and missing request identity are rejected', () => {
  assert.throws(() => provisionRequest({ ...inputs, repository: '../overwrite' }, policy, 'administrator'), /valid owner/);
  assert.throws(() => provisionRequest({ ...inputs, request_id: '' }, policy, 'administrator'), /request_id/);
});

test('a new playbook is a deterministic unpublished draft with typed resource folders', () => {
  const request = { slug: 'ai-era', name: 'NI Software with AI', value_thesis: 'Use reviewable AI-assisted workflows.' };
  const draft = playbookDraft(request, 'maintainer');
  assert.deepEqual(draft, playbookDraft(request, 'maintainer'));
  assert.equal(draft.config.status, 'draft');
  assert.equal(draft.config.publicApproved, false);
  assert.equal(draft.files.length, 6);
  assert(draft.files.every(file => file.path.startsWith('playbooks/ai-era/')));
  assert.throws(() => playbookDraft({ ...request, slug: '../outside' }, 'maintainer'), /slug/);
  assert.throws(() => playbookDraft({ ...request, slug: 'shared' }, 'maintainer'), /slug/);
});

test('the draft workflow can explicitly dispatch publication validation', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/add-playbook.yml', import.meta.url), 'utf8');
  assert.match(workflow, /^      actions: write$/m);
});