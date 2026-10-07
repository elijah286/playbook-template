import { defineConfig } from 'astro/config';
import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPlaybook } from './platform/content.mjs';
import { approvedBrandAssets } from './platform/branding.mjs';

const root = process.env.PLAYBOOK_ROOT ?? process.cwd();
const { config, resources } = await loadPlaybook(root);
const staging = resolve(process.cwd(), '.generated/public');
await rm(staging, { recursive: true, force: true });
await mkdir(resolve(staging, 'assets'), { recursive: true });
await mkdir(resolve(staging, 'branding'), { recursive: true });
for (const asset of await approvedBrandAssets()) await cp(asset.absolute, resolve(staging, 'branding', asset.file));
for (const resource of resources) {
  await cp(resource.absolute, resolve(staging, 'assets', `${resource.id}${resource.extension}`));
  if (resource.preview) await cp(resource.preview.absolute, resolve(staging, 'assets', `${resource.id}-preview${resource.preview.extension}`));
}

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