import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { loadCollection } from './content.mjs';
import { approvedBrandAssets } from './branding.mjs';
import { loadSlidePreviews } from './previews.mjs';

const { resources, config, playbooks, legacy } = await loadCollection(process.env.PLAYBOOK_ROOT ?? process.cwd());
const slidePreviews = await loadSlidePreviews(resources);
const output = resolve('dist');
for (const asset of await approvedBrandAssets()) {
  const publishedHash = createHash('sha256').update(await readFile(resolve(output, 'branding', asset.file))).digest('hex');
  if (publishedHash !== asset.sha256) throw new Error(`Published NI asset was altered: ${asset.file}`);
}
const indexBuffer = await readFile(resolve(output, 'search.json'));
if (indexBuffer.length > 5000000) throw new Error('Search index exceeds the 5 MB uncompressed budget');
const index = JSON.parse(indexBuffer);
if (index.length !== resources.length || index.some(document => !resources.some(resource => resource.id === document.id))) throw new Error('Search index does not match published resources');
const expectedAssets = new Set();
for (const book of playbooks.filter(book => !book.legacy)) {
  const directory = resolve(output, 'playbooks', book.slug);
  for (const route of ['', 'library', 'paths', 'contribute', 'community']) await stat(resolve(directory, route, 'index.html'));
  const index = JSON.parse(await readFile(resolve(directory, 'search.json'), 'utf8'));
  if (index.length !== book.resources.length || index.some(document => !book.resources.some(resource => resource.id === document.id))) throw new Error(`Scoped index mismatch: ${book.slug}`);
}
for (const resource of resources) {
  await stat(resolve(output, 'resources', resource.id, 'index.html'));
  const asset = `${resource.id}${resource.extension}`;
  expectedAssets.add(asset);
  const digest = createHash('sha256').update(await readFile(resolve(output, 'assets', asset))).digest('hex');
  if (digest !== resource.sha256) throw new Error(`Staged asset mismatch: ${resource.id}`);
  if (resource.preview) expectedAssets.add(`${resource.id}-preview${resource.preview.extension}`);
  if (playbooks.find(book => book.slug === resource.playbook)?.config.legacyResourceRoutes) {
    expectedAssets.add(`${resource.localId}${resource.extension}`);
    const legacyDigest = createHash('sha256').update(await readFile(resolve(output, 'assets', `${resource.localId}${resource.extension}`))).digest('hex');
    if (legacyDigest !== resource.sha256) throw new Error(`Legacy asset mismatch: ${resource.localId}`);
    if (resource.preview) expectedAssets.add(`${resource.localId}-preview${resource.preview.extension}`);
  }
  for (const [index, file] of resource.files.entries()) {
    const filename = `${resource.id}-file-${index + 1}${file.extension}`;
    expectedAssets.add(filename);
    const digest = createHash('sha256').update(await readFile(resolve(output, 'assets', filename))).digest('hex');
    if (digest !== file.sha256) throw new Error(`Supporting source mismatch: ${filename}`);
  }
  if ((resource.extension === '.pptx' || resource.extension === '.pdf' && resource.type === 'presentation') && !slidePreviews[resource.id]?.length) throw new Error(`Missing slide previews: ${resource.id}`);
  let previewBytes = 0;
  for (const slide of slidePreviews[resource.id] ?? []) for (const asset of [slide.image, slide.thumbnail]) {
    expectedAssets.add(asset);
    const info = await stat(resolve(output, 'assets', asset));
    if (info.size > 1000000) throw new Error(`Slide exceeds the 1 MB image budget: ${asset}`);
    previewBytes += info.size;
  }
  if (previewBytes > 25000000) throw new Error(`Slide previews exceed the 25 MB presentation budget: ${resource.id}`);
}
for (const asset of await readdir(resolve(output, 'assets'))) if (!expectedAssets.has(asset)) throw new Error(`Unexpected or unpublished asset: ${asset}`);
let javascriptBytes = 0;
for (const file of await readdir(resolve(output, '_astro'))) if (file.endsWith('.js')) javascriptBytes += gzipSync(await readFile(resolve(output, '_astro', file))).length;
if (javascriptBytes > 100000) throw new Error('Client JavaScript exceeds the 100 KB gzip budget');
console.log(`Verified ${resources.length} routes/assets; index ${indexBuffer.length} bytes; JavaScript ${javascriptBytes} gzip bytes. Mode: ${config.publication.mode}.`);