import { readdir, readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, extname, basename, dirname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';

export const categories = {
  'value-thesis': 'Value Thesis',
  discovery: 'Discovery',
  'sales-sbm': 'Sales and SBM',
  'fae-enablement': 'FAE Enablement',
  'customer-success': 'Customer Success',
  'partner-enablement': 'Partner Enablement',
  'partner-references': 'Partner References',
  'customer-enablement': 'Customer Enablement',
};
export const audiences = { sales: 'Sales / SBM', fae: 'FAE / Technical', 'customer-success': 'Customer Success', partner: 'Partner', customer: 'Customer' };
const formats = { '.md': 'guide', '.pptx': 'presentation', '.pdf': 'document', '.mp4': 'video', '.json': 'reference' };
const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const forbiddenNames = /^(?:\.git|\.github|node_modules|dist|build|ci-out|\.env.*|.*\.(?:pem|key))$/i;

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export function safeUrl(value) {
  const url = new URL(value);
  requireValue(url.protocol === 'https:' && !url.username && !url.password, `Unsafe external URL: ${value}`);
  requireValue(![...url.searchParams.keys()].some(key => /^(?:access_token|auth|authorization|token|sig|signature|secret|api[-_]?key|password|x-amz-.+|awsaccesskeyid)$/i.test(key)), 'External URLs must not embed bearer credentials or signed access tokens');
  return value;
}

async function readJson(file, fallback) {
  try {
    const info = await lstat(file);
    requireValue(!info.isSymbolicLink() && info.isFile(), `Metadata must be a regular file: ${file}`);
    const value = JSON.parse(await readFile(file, 'utf8'));
    requireValue(value && !Array.isArray(value) && typeof value === 'object', `Metadata must be an object: ${file}`);
    return value;
  }
  catch (error) { if (error.code === 'ENOENT' && fallback !== undefined) return fallback; throw error; }
}

export async function discover(root, config) {
  requireValue(['private', 'public-demo'].includes(config.publication?.mode), 'publication.mode must be private or public-demo');
  requireValue(config.publication.mode !== 'public-demo' || config.publication.publicDemoApproved === true, 'Public demo requires explicit distribution approval');
  const resourceRoot = resolve(root, 'resources');
  const resources = [];
  const ids = new Set();
  try {
    const rootInfo = await lstat(resourceRoot);
    requireValue(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), 'Resource root must be a regular directory; symlinks are not allowed');
  } catch (error) { if (error.code === 'ENOENT') return resources; throw error; }

  async function visit(directory, inherited = {}) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT' && directory === resourceRoot) return; throw error; }
    const defaults = { ...inherited, ...await readJson(resolve(directory, '_folder.json'), {}) };
    const bundle = await readJson(resolve(directory, '_bundle.json'), null);
    const files = bundle ? [{ name: bundle.entry ?? 'README.md', bundle }] : entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of files) {
      requireValue(!forbiddenNames.test(entry.name), `Forbidden content path: ${entry.name}`);
      const absolute = resolve(directory, entry.name);
      const resourcePath = relative(resourceRoot, absolute);
      requireValue(resourcePath !== '..' && !resourcePath.startsWith(`..${sep}`) && !resolve(resourceRoot, resourcePath).startsWith(`${root}${sep}.`), `Path escapes resources: ${entry.name}`);
      if (entry.name.startsWith('.') || entry.name === '_folder.json' || entry.name === '_bundle.json' || entry.name.endsWith('.resource.json')) continue;
      const info = await lstat(absolute);
      requireValue(!info.isSymbolicLink(), `Symlinks are not allowed: ${resourcePath}`);
      if (info.isDirectory()) { await visit(absolute, defaults); continue; }
      const extension = extname(entry.name).toLowerCase();
      if (!formats[extension]) continue;
      const metadata = { ...defaults, ...await readJson(`${absolute}.resource.json`, {}), ...(entry.bundle ?? {}) };
      const id = metadata.id ?? resourcePath.slice(0, -extension.length).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      requireValue(identifier.test(id), `Invalid resource ID: ${id}`);
      requireValue(!ids.has(id), `Duplicate resource ID: ${id}`);
      ids.add(id);
      const status = metadata.status ?? 'published';
      requireValue(['published', 'draft', 'archived'].includes(status), `${id}: invalid status`);
      if (status !== 'published') continue;
      requireValue(config.publication.mode !== 'public-demo' || metadata.publicApproved === true, `${id}: public distribution approval is missing (set on the file or resource folder)`);
      const selectedCategories = metadata.categories ?? ['fae-enablement'];
      const selectedAudiences = metadata.audiences ?? Object.keys(audiences);
      requireValue(Array.isArray(selectedCategories) && selectedCategories.every(category => categories[category]), `${id}: invalid categories`);
      requireValue(Array.isArray(selectedAudiences) && selectedAudiences.every(audience => audiences[audience]), `${id}: invalid audiences`);
      requireValue(info.size <= (config.assets?.maxLocalBytes ?? 25000000), `${id}: file exceeds local asset budget; use approved external storage`);
      const buffer = await readFile(absolute);
      const content = extension === '.md' ? buffer.toString('utf8') : '';
      requireValue(metadata.type === undefined || ['guide', 'presentation', 'document', 'video', 'reference', 'demonstration', 'technical-project'].includes(metadata.type), `${id}: unsupported resource type`);
      let preview = null;
      if (metadata.preview) {
        requireValue(typeof metadata.preview === 'string', `${id}: preview must be a path`);
        const previewPath = resolve(directory, metadata.preview);
        const previewRelative = relative(resourceRoot, previewPath);
        requireValue(!previewRelative.startsWith('..') && ['.png', '.jpg', '.webp'].includes(extname(previewPath)), `${id}: invalid preview path`);
        const previewInfo = await lstat(previewPath);
        requireValue(previewInfo.isFile() && !previewInfo.isSymbolicLink() && previewInfo.size <= 1000000, `${id}: preview must be a regular image under 1 MB`);
        const canonicalPreview = await realpath(previewPath);
        requireValue(canonicalPreview.startsWith(`${resourceRoot}${sep}`), `${id}: preview escapes resources`);
        preview = { absolute: previewPath, extension: extname(previewPath) };
      }
      for (const field of ['title', 'summary', 'owner', 'duration', 'prerequisites', 'reviewStatus', 'reviewDate', 'keyMessages']) requireValue(metadata[field] === undefined || typeof metadata[field] === 'string', `${id}: ${field} must be text`);
      for (const field of ['topics', 'outcomes', 'relatedResources', 'aliases']) requireValue(metadata[field] === undefined || Array.isArray(metadata[field]) && metadata[field].every(value => typeof value === 'string'), `${id}: ${field} must be a text list`);
      requireValue(metadata.links === undefined || Array.isArray(metadata.links), `${id}: links must be a list`);
      for (const link of metadata.links ?? []) safeUrl(link.url);
      if (metadata.provenance?.url) safeUrl(metadata.provenance.url);
      if (content) marked.walkTokens(marked.lexer(content), token => {
        if (['link', 'image'].includes(token.type)) requireValue(token.href.startsWith('#') || /^https:\/\//.test(token.href) && safeUrl(token.href), `${id}: Markdown links must be HTTPS or same-page anchors`);
      });
      resources.push({ ...metadata, preview, id, title: metadata.title ?? basename(entry.name, extension).replace(/[-_]/g, ' '), type: metadata.type ?? formats[extension], categories: selectedCategories, audiences: selectedAudiences, summary: metadata.summary ?? '', status, owner: metadata.owner ?? config.maintainer ?? 'playbook-maintainer', relatedResources: metadata.relatedResources ?? [], aliases: metadata.aliases ?? [], topics: metadata.topics ?? [], outcomes: metadata.outcomes ?? [], absolute, relative: resourcePath.split(sep).join('/'), extension, size: info.size, sha256: createHash('sha256').update(buffer).digest('hex'), content });
    }
  }
  await visit(resourceRoot);
  const publishedIds = new Set(resources.map(resource => resource.id));
  for (const resource of resources) {
    requireValue(Array.isArray(resource.relatedResources), `${resource.id}: relatedResources must be a list`);
    for (const related of resource.relatedResources) requireValue(publishedIds.has(related), `${resource.id}: related resource ${related} is missing or unpublished`);
    for (const alias of resource.aliases) {
      requireValue(identifier.test(alias) && !ids.has(alias), `${resource.id}: invalid or duplicate alias ${alias}`);
      ids.add(alias);
    }
  }
  return resources.sort((left, right) => left.title.localeCompare(right.title));
}

export async function loadPlaybook(root = process.cwd()) {
  const config = await readJson(resolve(root, 'playbook.json'));
  requireValue(typeof config.name === 'string' && config.name.trim(), 'playbook.name is required');
  requireValue(typeof config.valueThesis === 'string', 'playbook.valueThesis is required');
  if (config.overview !== undefined) {
    const copyKeys = ['pathsHeading', 'featuredHeading', 'communityHeading', 'communityDescription', 'primaryAction', 'secondaryAction'];
    requireValue(config.overview && !Array.isArray(config.overview) && typeof config.overview === 'object', 'overview must be a copy configuration object');
    for (const [key, value] of Object.entries(config.overview)) requireValue(copyKeys.includes(key) && typeof value === 'string' && value.trim() && value.length <= 1000, `overview.${key}: only supported text copy may be customized`);
  }
  if (config.lifecycle !== undefined) {
    requireValue(Array.isArray(config.lifecycle) && config.lifecycle.length === 5, 'lifecycle must provide the five shared playbook stages');
    for (const stage of config.lifecycle) requireValue(stage && ['name', 'summary', 'search'].every(key => typeof stage[key] === 'string' && stage[key].trim() && stage[key].length <= 200), 'Each stage requires name, summary, and search text');
  }
  if (config.outcomes !== undefined) requireValue(Array.isArray(config.outcomes) && config.outcomes.length === 3 && config.outcomes.every(outcome => typeof outcome === 'string' && outcome.trim() && outcome.length <= 200), 'outcomes must provide three customer outcome labels');
  if (config.audienceGuidance !== undefined) {
    requireValue(config.audienceGuidance && !Array.isArray(config.audienceGuidance) && typeof config.audienceGuidance === 'object', 'audienceGuidance must be an object');
    for (const [key, value] of Object.entries(config.audienceGuidance)) requireValue(Object.hasOwn(audiences, key) && typeof value === 'string' && value.trim(), 'audienceGuidance must contain supported audience keys and text');
  }
    requireValue(config.site && typeof config.site.origin === 'string' && typeof config.site.base === 'string', 'site.origin and site.base are required');
    requireValue(!config.repository || /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(config.repository), 'repository must be an owner/name identifier');
    requireValue(config.analytics?.enabled !== true, 'Analytics requires a separate approved implementation; it is not enabled by this renderer');
  if (config.site?.origin) safeUrl(config.site.origin);
  requireValue(!config.site?.base || /^\/[a-zA-Z0-9/-]*$/.test(config.site.base), 'site.base must be a safe absolute path');
  return { config, resources: await discover(await realpath(root), config) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { config, resources } = await loadPlaybook(process.env.PLAYBOOK_ROOT ?? process.cwd());
  console.log(`Validated ${resources.length} published resources for ${config.name}. Mode: ${config.publication.mode}.`);
}