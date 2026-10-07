import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { loadPlaybook } from './content.mjs';
import { approvedBrandAssets } from './branding.mjs';

const { resources, config } = await loadPlaybook(process.env.PLAYBOOK_ROOT ?? process.cwd());
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
for (const resource of resources) {
  await stat(resolve(output, 'resources', resource.id, 'index.html'));
  const asset = `${resource.id}${resource.extension}`;
  expectedAssets.add(asset);
  const digest = createHash('sha256').update(await readFile(resolve(output, 'assets', asset))).digest('hex');
  if (digest !== resource.sha256) throw new Error(`Staged asset mismatch: ${resource.id}`);
  if (resource.preview) expectedAssets.add(`${resource.id}-preview${resource.preview.extension}`);
}
for (const asset of await readdir(resolve(output, 'assets'))) if (!expectedAssets.has(asset)) throw new Error(`Unexpected or unpublished asset: ${asset}`);
let javascriptBytes = 0;
for (const file of await readdir(resolve(output, '_astro'))) if (file.endsWith('.js')) javascriptBytes += gzipSync(await readFile(resolve(output, '_astro', file))).length;
if (javascriptBytes > 100000) throw new Error('Client JavaScript exceeds the 100 KB gzip budget');
console.log(`Verified ${resources.length} routes/assets; index ${indexBuffer.length} bytes; JavaScript ${javascriptBytes} gzip bytes. Mode: ${config.publication.mode}.`);