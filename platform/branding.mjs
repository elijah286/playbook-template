import { readFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export async function approvedBrandAssets() {
  const manifest = JSON.parse(await readFile(new URL('./assets/branding.json', import.meta.url), 'utf8'));
  if (!manifest.approval || !Array.isArray(manifest.assets)) throw new Error('Brand asset approval inventory is missing');
  return Promise.all(manifest.assets.map(async asset => {
    if (!/^[a-z0-9-]+\.(png|jpg|webp)$/.test(asset.file) || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error('Invalid approved brand asset identity');
    const source = new URL(asset.source);
    if (source.protocol !== 'https:' || !['www.ni.com', 'ni.scene7.com'].includes(source.hostname) || source.username || source.password) throw new Error('Brand assets must have an approved official NI source');
    const absolute = fileURLToPath(new URL(`./assets/${asset.file}`, import.meta.url));
    const info = await lstat(absolute);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Brand asset must be an original regular file: ${asset.file}`);
    const hash = createHash('sha256').update(await readFile(absolute)).digest('hex');
    if (hash !== asset.sha256) throw new Error(`Approved NI asset has been altered: ${asset.file}`);
    return { ...asset, absolute };
  }));
}