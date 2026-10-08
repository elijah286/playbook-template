import { defineConfig } from 'astro/config';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadCollection } from './platform/content.mjs';
import { approvedBrandAssets } from './platform/branding.mjs';
import { stageSlidePreviews, previewManifestPath, contentRootKey } from './platform/previews.mjs';

const root = process.env.PLAYBOOK_ROOT ?? process.cwd();
const { config, resources, playbooks } = await loadCollection(root);
const staging = resolve(process.cwd(), `.generated/public-${contentRootKey}`);
await rm(staging, { recursive: true, force: true });
await mkdir(resolve(staging, 'assets'), { recursive: true });
await mkdir(resolve(staging, 'branding'), { recursive: true });
for (const asset of await approvedBrandAssets()) await cp(asset.absolute, resolve(staging, 'branding', asset.file));
for (const resource of resources) {
  await cp(resource.absolute, resolve(staging, 'assets', `${resource.id}${resource.extension}`));
  if (resource.preview) await cp(resource.preview.absolute, resolve(staging, 'assets', `${resource.id}-preview${resource.preview.extension}`));
  for (const [index, file] of resource.files.entries()) await cp(file.absolute, resolve(staging, 'assets', `${resource.id}-file-${index + 1}${file.extension}`));
  if (playbooks.find(book => book.slug === resource.playbook)?.config.legacyResourceRoutes) {
    await cp(resource.absolute, resolve(staging, 'assets', `${resource.localId}${resource.extension}`));
    if (resource.preview) await cp(resource.preview.absolute, resolve(staging, 'assets', `${resource.localId}-preview${resource.preview.extension}`));
  }
}
await writeFile(previewManifestPath, '{}\n');
const slidePreviews = await stageSlidePreviews(resources, resolve(staging, 'assets'));
await writeFile(previewManifestPath, `${JSON.stringify(slidePreviews)}\n`);

export default defineConfig({
  output: 'static',
  srcDir: './platform/src',
  publicDir: staging,
  site: config.site.origin,
  base: config.site.base,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { format: 'directory', inlineStylesheets: 'never' },
});