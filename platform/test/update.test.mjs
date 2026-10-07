import test from 'node:test';
import assert from 'node:assert/strict';
import { platformOwned, updatePlan } from '../update.mjs';

test('shared upgrades cannot replace owner content, configuration, or instance docs', () => {
  for (const file of ['resources/customer.md', 'playbook.json', 'README.md', 'docs/customer-guide.md', 'platform/../resources/customer.md']) assert.equal(platformOwned(file), false);
  for (const file of ['platform/src/styles.css', 'platform/assets/ni-logo.png', 'astro.config.mjs', 'package-lock.json']) assert.equal(platformOwned(file), true);
  const plan = updatePlan({ tree: [{ path: 'platform/src/styles.css', mode: '100644', type: 'blob', sha: 'new' }, { path: 'resources/customer.md', mode: '100644', type: 'blob', sha: 'content' }] }, { 'platform/removed.mjs': 'old', 'resources/customer.md': 'content' });
  assert.deepEqual(plan.files.map(file => file.path), ['platform/src/styles.css']);
  assert.deepEqual(plan.removed, ['platform/removed.mjs']);
});
test('unsafe or incomplete shared upgrades stop without deleting content', () => {
  assert.throws(() => updatePlan({ truncated: true, tree: [] }), /Incomplete/);
  assert.throws(() => updatePlan({ tree: [{ path: 'platform/link.mjs', mode: '120000', type: 'blob' }] }), /symlinks/);
});