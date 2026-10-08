import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discover, safeUrl, loadPlaybook, loadCollection } from '../content.mjs';

const privateConfig = { publication: { mode: 'private' } };
const publicConfig = { publication: { mode: 'public-demo', publicDemoApproved: true } };

async function fixture(callback) {
  const root = await mkdtemp(join(tmpdir(), 'playbook-test-'));
  await mkdir(join(root, 'resources', 'presentations'), { recursive: true });
  try { await callback(root); } finally { await rm(root, { recursive: true, force: true }); }
}

test('a browser-uploaded presentation is discovered without a central index', () => fixture(async root => {
  await writeFile(join(root, 'resources/presentations/Architecture overview.pptx'), 'fixture');
  const resources = await discover(root, privateConfig);
  assert.equal(resources[0].type, 'presentation');
  assert.equal(resources[0].id, 'presentations-architecture-overview');
}));

test('public mode fails closed without resource approval', () => fixture(async root => {
  await writeFile(join(root, 'resources/presentations/private.pptx'), 'fixture');
  await assert.rejects(discover(root, publicConfig), /distribution approval/);
}));

test('explicit metadata overrides approved-folder defaults and drafts never enter output', () => fixture(async root => {
  await writeFile(join(root, 'resources/presentations/_folder.json'), JSON.stringify({ publicApproved: true, title: 'Default' }));
  await writeFile(join(root, 'resources/presentations/first.pptx'), 'fixture');
  await writeFile(join(root, 'resources/presentations/first.pptx.resource.json'), JSON.stringify({ title: 'Explicit' }));
  await writeFile(join(root, 'resources/presentations/hidden.pptx'), 'fixture');
  await writeFile(join(root, 'resources/presentations/hidden.pptx.resource.json'), JSON.stringify({ status: 'draft' }));
  const resources = await discover(root, publicConfig);
  assert.deepEqual(resources.map(resource => resource.title), ['Explicit']);
}));

test('duplicate stable IDs are blocking errors', () => fixture(async root => {
  for (const name of ['first', 'second']) {
    await writeFile(join(root, `resources/presentations/${name}.md`), 'Content');
    await writeFile(join(root, `resources/presentations/${name}.md.resource.json`), JSON.stringify({ id: 'same-id' }));
  }
  await assert.rejects(discover(root, privateConfig), /Duplicate/);
}));

test('missing or draft relationships block publication', () => fixture(async root => {
  await writeFile(join(root, 'resources/presentations/start.md'), 'Content');
  await writeFile(join(root, 'resources/presentations/start.md.resource.json'), JSON.stringify({ relatedResources: ['missing'] }));
  await assert.rejects(discover(root, privateConfig), /missing or unpublished/);
}));

test('symlinks and bundle traversal are rejected', () => fixture(async root => {
  await symlink('/etc/passwd', join(root, 'resources/presentations/leak.md'));
  await assert.rejects(discover(root, privateConfig), /Symlinks/);
  await rm(join(root, 'resources/presentations/leak.md'));
  await writeFile(join(root, 'resources/presentations/_bundle.json'), JSON.stringify({ entry: '../../../etc/passwd' }));
  await assert.rejects(discover(root, privateConfig), /escapes/);
}));

test('demo bundles produce one resource', () => fixture(async root => {
  await writeFile(join(root, 'resources/presentations/_bundle.json'), JSON.stringify({ id: 'demo-bundle', type: 'demonstration' }));
  await writeFile(join(root, 'resources/presentations/README.md'), 'Demonstration');
  await writeFile(join(root, 'resources/presentations/helper.md'), 'Internal helper');
  assert.equal((await discover(root, privateConfig)).length, 1);
}));

test('unsafe external links are rejected', () => {
  assert.throws(() => safeUrl('javascript:alert(1)'), /Unsafe/);
  assert.throws(() => safeUrl('https://token@example.com'), /Unsafe/);
  assert.throws(() => safeUrl('https://user:never-log-this@example.com'), error => !error.message.includes('never-log-this'));
  assert.throws(() => safeUrl('https://example.com/file?token=secret'), /bearer credentials/);
  assert.throws(() => safeUrl('https://example.com/file?X-Amz-Signature=secret'), /bearer credentials/);
  assert.equal(safeUrl('https://www.ni.com/docs/en-US/'), 'https://www.ni.com/docs/en-US/');
});

test('a symlink at the resource root cannot expose files outside the content boundary', () => fixture(async root => {
  await rm(join(root, 'resources'), { recursive: true });
  await mkdir(join(root, 'outside'));
  await writeFile(join(root, 'outside/leak.md'), 'Never publish this');
  await symlink(join(root, 'outside'), join(root, 'resources'));
  await assert.rejects(discover(root, privateConfig), /Resource root/);
}));

test('200 resources remain deterministic and an arbitrary topic needs no code change', () => fixture(async root => {
  for (let index = 0; index < 200; index++) await writeFile(join(root, `resources/presentations/guide-${index}.md`), `Guidance ${index}`);
  const resources = await discover(root, { ...privateConfig, name: 'Cryogenic measurement strategy' });
  assert.equal(resources.length, 200);
  assert.deepEqual(resources.map(resource => resource.id), (await discover(root, privateConfig)).map(resource => resource.id));
}));

test('owners can tailor copy for any topic without adding layout or branding settings', () => fixture(async root => {
  const config = { ...privateConfig, name: 'Cryogenic Measurement Strategy', valueThesis: 'Retain useful measurement evidence.', site: { origin: 'https://example.invalid', base: '/' }, overview: { pathsHeading: 'Start With Your Measurement Role' }, lifecycle: Array.from({ length: 5 }, (_, index) => ({ name: `Stage ${index + 1}`, summary: 'Topic-specific copy', search: 'measurement' })), outcomes: ['Repeatability', 'Traceability', 'Maintainability'] };
  await writeFile(join(root, 'playbook.json'), JSON.stringify(config));
  assert.equal((await loadPlaybook(root)).config.overview.pathsHeading, 'Start With Your Measurement Role');
  await writeFile(join(root, 'playbook.json'), JSON.stringify({ ...config, overview: { layout: 'different-theme' } }));
  await assert.rejects(loadPlaybook(root), /only supported text copy/);
  await writeFile(join(root, 'playbook.json'), JSON.stringify({ ...config, lifecycle: [] }));
  await assert.rejects(loadPlaybook(root), /five shared/);
}));

async function collectionFixture(root) {
  await writeFile(join(root, 'hub.json'), JSON.stringify({ ...privateConfig, name: 'Customer Value Playbooks', valueThesis: 'Find practical resources.', site: { origin: 'https://example.invalid', base: '/' } }));
  for (const slug of ['ai-era', 'modern-sdlc']) {
    await mkdir(join(root, 'playbooks', slug, 'resources'), { recursive: true });
    await writeFile(join(root, 'playbooks', slug, 'playbook.json'), JSON.stringify({ name: slug, valueThesis: `Value for ${slug}` }));
    await writeFile(join(root, 'playbooks', slug, 'resources', 'start.md'), `# ${slug}`);
  }
}

test('playbooks are folder-discovered with scoped, collision-free resources', () => fixture(async root => {
  await collectionFixture(root);
  const hub = await loadCollection(root);
  assert.equal(hub.legacy, false);
  assert.equal(hub.playbooks.length, 2);
  assert.deepEqual(hub.resources.map(resource => resource.id), ['ai-era--start', 'modern-sdlc--start']);
  assert.equal(hub.playbooks[0].resources[0].playbook, 'ai-era');
  assert.equal(hub.playbooks[0].config.site.base, '/');
}));

test('shared resources are explicitly included once and unused assets stay out', () => fixture(async root => {
  await collectionFixture(root);
  await mkdir(join(root, 'shared', 'resources'), { recursive: true });
  await writeFile(join(root, 'shared', 'resources', 'common.md'), '# Common');
  await writeFile(join(root, 'shared', 'resources', 'unused.md'), '# Unused');
  for (const slug of ['ai-era', 'modern-sdlc']) await writeFile(join(root, 'playbooks', slug, 'playbook.json'), JSON.stringify({ name: slug, valueThesis: 'Useful materials', sharedResources: ['common'] }));
  const hub = await loadCollection(root);
  assert.equal(hub.resources.length, 3);
  assert.deepEqual(hub.resources.find(resource => resource.id === 'shared--common').playbooks, ['ai-era', 'modern-sdlc']);
  assert.equal(hub.resources.some(resource => resource.localId === 'unused'), false);
}));

test('playbooks cannot override the hub publication boundary and drafts stay out', () => fixture(async root => {
  await collectionFixture(root);
  const filename = join(root, 'playbooks', 'ai-era', 'playbook.json');
  await writeFile(filename, JSON.stringify({ name: 'AI', valueThesis: 'AI', publication: { mode: 'public-demo', publicDemoApproved: true } }));
  await assert.rejects(loadCollection(root), /inherit publication/);
  await writeFile(filename, JSON.stringify({ name: 'AI', valueThesis: 'AI', status: 'draft' }));
  assert.equal((await loadCollection(root)).playbooks.length, 1);
}));

test('missing shared references and playbook symlinks fail closed', () => fixture(async root => {
  await collectionFixture(root);
  const filename = join(root, 'playbooks', 'ai-era', 'playbook.json');
  await writeFile(filename, JSON.stringify({ name: 'AI', valueThesis: 'AI', sharedResources: ['missing'] }));
  await assert.rejects(loadCollection(root), /missing or unpublished/);
  await rm(join(root, 'playbooks', 'ai-era'), { recursive: true });
  await symlink(join(root, 'playbooks', 'modern-sdlc'), join(root, 'playbooks', 'ai-era'));
  await assert.rejects(loadCollection(root), /symlinks/);
}));

test('single-playbook instances remain compatible', () => fixture(async root => {
  await writeFile(join(root, 'playbook.json'), JSON.stringify({ ...privateConfig, name: 'Existing Playbook', valueThesis: 'Existing value', site: { origin: 'https://example.invalid', base: '/' } }));
  const hub = await loadCollection(root);
  assert.equal(hub.legacy, true);
  assert.equal(hub.playbooks[0].config.name, 'Existing Playbook');
}));

test('shared directory symlinks cannot escape the collection', () => fixture(async root => {
  await collectionFixture(root);
  await mkdir(join(root, 'outside', 'resources'), { recursive: true });
  await symlink(join(root, 'outside'), join(root, 'shared'));
  await assert.rejects(loadCollection(root), /Shared resources must be a regular directory/);
}));

test('email templates and explicit code bundle files are previewed without execution', () => fixture(async root => {
  await writeFile(join(root, 'resources', 'message.txt'), 'Subject: Next steps\n\nHello team');
  await mkdir(join(root, 'resources', 'example'));
  await writeFile(join(root, 'resources', 'example', 'README.md'), '# Example');
  await writeFile(join(root, 'resources', 'example', 'example.mjs'), 'throw new Error("never execute");');
  await writeFile(join(root, 'resources', 'example', '_bundle.json'), JSON.stringify({ type: 'technical-project', files: ['example.mjs'] }));
  const resources = await discover(root, privateConfig);
  assert.equal(resources.find(resource => resource.type === 'email-template').source, 'Subject: Next steps\n\nHello team');
  assert.equal(resources.find(resource => resource.type === 'technical-project').files[0].source, 'throw new Error("never execute");');
  await writeFile(join(root, 'resources', 'example', '_bundle.json'), JSON.stringify({ files: ['../../../outside.mjs'] }));
  await assert.rejects(discover(root, privateConfig), /escapes resources/);
}));