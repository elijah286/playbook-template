import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readdir, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stageSlidePreviews, loadSlidePreviews } from '../previews.mjs';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'playbook-preview-test-'));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}
const presentation = { id: 'example-deck', extension: '.pptx', sha256: 'source-revision', type: 'presentation' };
async function render(resource, directory) {
  for (const prefix of ['slide', 'thumb']) for (const index of [1, 2]) await writeFile(join(directory, `${prefix}-${index}.jpg`), 'fixture image');
  return 2;
}

test('published presentations stage ordered slides and thumbnails bound to their source', () => fixture(async root => {
  const manifest = await stageSlidePreviews([presentation, { id: 'guide', extension: '.md' }], root, { render });
  assert.deepEqual(Object.keys(manifest), ['example-deck']);
  assert.deepEqual(manifest['example-deck'].slides, [
    { image: 'example-deck-slide-1.jpg', thumbnail: 'example-deck-thumb-1.jpg' },
    { image: 'example-deck-slide-2.jpg', thumbnail: 'example-deck-thumb-2.jpg' },
  ]);
  assert.equal((await readdir(root)).length, 4);
  const filename = join(root, 'manifest.json');
  await writeFile(filename, JSON.stringify(manifest));
  assert.deepEqual(await loadSlidePreviews([presentation], filename), { 'example-deck': manifest['example-deck'].slides });
  assert.deepEqual(await loadSlidePreviews([{ ...presentation, sha256: 'changed' }], filename), {});
  assert.deepEqual(await loadSlidePreviews([], filename), {});
}));

test('missing previews do not invent slide assets', () => fixture(async root => {
  assert.deepEqual(await loadSlidePreviews([presentation], join(root, 'missing.json')), {});
  assert.deepEqual(await stageSlidePreviews([], root, { render }), {});
}));

test('preview manifests cannot point outside their resource assets', () => fixture(async root => {
  const filename = join(root, 'manifest.json');
  await writeFile(filename, JSON.stringify({ 'example-deck': { source: presentation.sha256, slides: [{ image: '../private.jpg', thumbnail: 'example-deck-thumb-1.jpg' }] } }));
  await assert.rejects(loadSlidePreviews([presentation], filename), /invalid slide asset path/);
}));

test('conversion rejects excessive slide counts and oversized or symlinked images', () => fixture(async root => {
  await assert.rejects(stageSlidePreviews([presentation], root, { render: async () => 151 }), /invalid slide preview count/);
  await assert.rejects(stageSlidePreviews([presentation], root, { render: async (resource, directory) => {
    await writeFile(join(directory, 'slide-1.jpg'), Buffer.alloc(1000001));
    return 1;
  } }), /regular images under 1 MB/);
  await assert.rejects(stageSlidePreviews([presentation], root, { render: async (resource, directory) => {
    await writeFile(join(root, 'outside.jpg'), 'private');
    await symlink(join(root, 'outside.jpg'), join(directory, 'slide-1.jpg'));
    return 1;
  } }), /regular images under 1 MB/);
}));