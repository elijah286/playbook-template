import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { approvedBrandAssets } from '../branding.mjs';

test('the shared NI logo matches the explicitly approved official asset checksum', async () => {
  const assets = await approvedBrandAssets();
  assert.equal(assets[0].file, 'ni-logo.png');
  assert.equal(assets[0].sha256, 'e143718fec4cac4a9932d73e32d39bd6447d885df5f1aa9b080e3d09653f77cc');
  assert.equal(assets[1].sha256, '1d3bf24fbdb85b45831c1c7f2afab9c39987f3847fa042cb5a597be76054f16e');
});
test('the shared shell contains no drawn or typographic NI replacement', async () => {
  const shell = await readFile(new URL('../src/layouts/Shell.astro', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert(!shell.includes('ni-mark'));
  assert(!shell.includes('footer-mark'));
  assert(!styles.includes('hero-band:before'));
  assert(!styles.includes('repeating-linear-gradient'));
  assert(shell.includes('branding/ni-logo.png'));
});