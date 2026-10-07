import test from 'node:test';
import assert from 'node:assert/strict';
import { provisionRequest } from '../provision.mjs';

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