import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, lstat, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const execute = promisify(execFile);
const maxSlides = 150;
export const contentRootKey = createHash('sha256').update(resolve(process.env.PLAYBOOK_ROOT ?? process.cwd())).digest('hex').slice(0, 12);
export const previewManifestPath = resolve(`.generated/slide-previews-${contentRootKey}.json`);

async function runTool(tool, args, directory) {
  const sandboxed = process.env.PLAYBOOK_PREVIEW_RENDERER === 'docker';
  const command = sandboxed ? 'docker' : tool;
  const parameters = sandboxed ? ['run', '--rm', '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', '128', '--memory', '1g', '--cpus', '2', '--user', `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`, '--tmpfs', '/tmp:rw,noexec,nosuid,size=256m', '-e', 'HOME=/tmp', '-v', `${directory}:/work`, '-w', '/work', 'playbook-preview-renderer', 'timeout', '--signal=KILL', '110s', tool, ...args] : args;
  try {
    return await execute(command, parameters, { cwd: directory, timeout: 120000, killSignal: 'SIGKILL', maxBuffer: 1000000, env: { PATH: process.env.PATH, LANG: 'en_US.UTF-8', HOME: sandboxed ? process.env.HOME : directory, DOCKER_HOST: process.env.DOCKER_HOST, DOCKER_CONTEXT: process.env.DOCKER_CONTEXT, TMPDIR: tmpdir() } });
  } catch (error) {
    throw new Error(`Slide preview conversion failed (${tool}). Install LibreOffice and Poppler, or build the sandboxed preview renderer. ${error.message}`, { cause: error });
  }
}

async function renderSlides(resource, directory) {
  await cp(resource.absolute, resolve(directory, `source${resource.extension}`));
  if (resource.extension === '.pptx') {
    const profile = process.env.PLAYBOOK_PREVIEW_RENDERER === 'docker' ? 'file:///tmp/office' : pathToFileURL(resolve(directory, 'office')).href;
    await runTool('soffice', [`-env:UserInstallation=${profile}`, '--headless', '--nologo', '--nodefault', '--norestore', '--convert-to', 'pdf:impress_pdf_Export:{"ExportHiddenSlides":{"type":"boolean","value":"false"},"ExportNotesPages":{"type":"boolean","value":"false"}}', '--outdir', '.', 'source.pptx'], directory);
  }
  const { stdout } = await runTool('pdfinfo', ['source.pdf'], directory);
  const count = Number(stdout.match(/^Pages:\s+(\d+)/m)?.[1]);
  if (!Number.isInteger(count) || count < 1 || count > maxSlides) throw new Error(`${resource.id}: slide previews require 1-${maxSlides} visible slides`);
  await runTool('pdftoppm', ['-jpeg', '-jpegopt', 'quality=82', '-scale-to', '1440', 'source.pdf', 'slide'], directory);
  await runTool('pdftoppm', ['-jpeg', '-jpegopt', 'quality=75', '-scale-to', '320', 'source.pdf', 'thumb'], directory);
  return count;
}

export async function stageSlidePreviews(resources, assetDirectory, { render = renderSlides } = {}) {
  const manifest = {};
  await mkdir(assetDirectory, { recursive: true });
  const workRoot = process.env.PLAYBOOK_PREVIEW_RENDERER === 'docker' ? resolve('.generated/preview-work') : tmpdir();
  await mkdir(workRoot, { recursive: true });
  for (const resource of resources) {
    if (resource.extension !== '.pptx' && !(resource.extension === '.pdf' && resource.type === 'presentation')) continue;
    const directory = await mkdtemp(resolve(workRoot, 'playbook-slides-'));
    try {
      const count = await render(resource, directory);
      if (!Number.isInteger(count) || count < 1 || count > maxSlides) throw new Error(`${resource.id}: invalid slide preview count`);
      const slides = [];
      let totalBytes = 0;
      for (let index = 1; index <= count; index++) {
        const slide = {};
        for (const [key, prefix] of [['image', 'slide'], ['thumbnail', 'thumb']]) {
          const source = resolve(directory, `${prefix}-${String(index).padStart(String(count).length, '0')}.jpg`);
          const info = await lstat(source);
          if (!info.isFile() || info.isSymbolicLink() || info.size > 1000000) throw new Error(`${resource.id}: slide previews must be regular images under 1 MB`);
          totalBytes += info.size;
          if (totalBytes > 25000000) throw new Error(`${resource.id}: slide previews exceed the 25 MB presentation budget`);
          const filename = `${resource.id}-${prefix}-${index}.jpg`;
          await cp(source, resolve(assetDirectory, filename));
          slide[key] = filename;
        }
        slides.push(slide);
      }
      manifest[resource.id] = { source: resource.sha256, slides };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
  return manifest;
}

export async function loadSlidePreviews(resources, filename = previewManifestPath) {
  let manifest;
  try { manifest = JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
  const previews = {};
  for (const resource of resources) {
    const entry = manifest[resource.id];
    if (!entry || entry.source !== resource.sha256) continue;
    if (!Array.isArray(entry.slides) || !entry.slides.length || entry.slides.length > maxSlides) throw new Error(`${resource.id}: invalid slide manifest`);
    entry.slides.forEach((slide, index) => {
      if (slide.image !== `${resource.id}-slide-${index + 1}.jpg` || slide.thumbnail !== `${resource.id}-thumb-${index + 1}.jpg`) throw new Error(`${resource.id}: invalid slide asset path`);
    });
    previews[resource.id] = entry.slides;
  }
  return previews;
}