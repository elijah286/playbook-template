import test from 'node:test';
import assert from 'node:assert/strict';
import { submission } from '../submissions.mjs';

const issue = { number: 42, user: { login: 'contributor' }, body: '### Resource Title\n\nA useful reference\n\n### Summary\n\nA bounded description.\n\n### Audience\n\nFAE / Technical\n\n### Category\n\nFAE Enablement\n\n### Reference URL\n\nhttps://www.ni.com/docs/' };
test('authorized form conversion creates a stable draft, never a public resource', () => {
  const result = submission(issue, 'write', 'admin');
  assert.equal(result.id, 'request-42');
  assert.equal(result.metadata.status, 'draft');
  assert.equal(result.metadata.publicApproved, false);
  assert.deepEqual(result.metadata.audiences, ['fae']);
});
test('reader submissions and reader approvals cannot gain write access', () => {
  assert.throws(() => submission(issue, 'read', 'admin'), /write permission/);
  assert.throws(() => submission(issue, 'write', 'read'), /write permission/);
});
test('incomplete and unsafe submissions are rejected', () => {
  assert.throws(() => submission({ ...issue, body: 'Missing fields' }, 'write', 'admin'), /Complete/);
  assert.throws(() => submission({ ...issue, body: issue.body.replace('https://www.ni.com/docs/', 'javascript:alert(1)') }, 'write', 'admin'), /Unsafe/);
});