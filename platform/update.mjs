import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { api, optional, commitFiles } from './github.mjs';

const ownedRootFiles = new Set(['astro.config.mjs', 'package.json', 'package-lock.json', '.github/ISSUE_TEMPLATE/resource.yml', '.github/ISSUE_TEMPLATE/config.yml', '.github/workflows/publish.yml', '.github/workflows/convert-request.yml', '.github/workflows/create-playbook.yml', '.github/workflows/update-platform.yml', '.github/workflows/maintenance.yml']);
export function platformOwned(file) { return ownedRootFiles.has(file) || file.startsWith('platform/') && !file.split('/').some(part => part === '..' || part === '.' || part.startsWith('.')); }

export function updatePlan(upstream, previous = {}) {
  if (upstream.truncated || !Array.isArray(upstream.tree)) throw new Error('Incomplete upstream file inventory');
  const files = upstream.tree.filter(entry => entry.type === 'blob' && platformOwned(entry.path));
  if (files.some(entry => !['100644', '100755'].includes(entry.mode))) throw new Error('Upstream platform cannot contain symlinks or submodules');
  return { files, removed: Object.keys(previous).filter(file => platformOwned(file) && !files.some(entry => entry.path === file)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { inputs } = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const revision = inputs.source_revision;
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Choose an exact reviewed 40-character platform commit, not a floating branch');
  const repository = process.env.GITHUB_REPOSITORY;
  const actor = api(`repos/${repository}/collaborators/${process.env.GITHUB_ACTOR}/permission`).permission;
  if (!['admin', 'maintain'].includes(actor)) throw new Error('Platform adoption requires a repository administrator or maintainer');
  const source = 'elijah286/playbook-template';
  const upstream = api(`repos/${source}/git/trees/${revision}?recursive=1`);
  const lockFile = optional(`repos/${repository}/contents/platform-lock.json`);
  const previous = lockFile ? JSON.parse(Buffer.from(lockFile.content, 'base64').toString('utf8')) : { files: {} };
  if (previous.sourceRevision === revision) { console.log('This exact platform revision is already adopted.'); process.exit(0); }
  const current = api(`repos/${repository}/git/trees/main?recursive=1`);
  if (current.truncated) throw new Error('Current repository inventory is incomplete');
  for (const [file, sha] of Object.entries(previous.files)) if (current.tree.find(entry => entry.path === file)?.sha !== sha) throw new Error(`Local platform customization found: ${file}. Review it before adopting an update; content was not overwritten.`);
  const plan = updatePlan(upstream, previous.files);
  const files = plan.files.map(entry => {
    const blob = api(`repos/${source}/git/blobs/${entry.sha}`);
    if (blob.encoding !== 'base64') throw new Error(`Unsupported upstream encoding: ${entry.path}`);
    return { path: entry.path, base64: blob.content };
  });
  files.push(...plan.removed.map(file => ({ path: file, sha: null })));
  files.push({ path: 'platform-lock.json', content: `${JSON.stringify({ source, sourceRevision: revision, previousRevision: previous.sourceRevision ?? null, files: Object.fromEntries(plan.files.map(entry => [entry.path, entry.sha])) }, null, 2)}\n` });
  const branch = `platform-update-${revision.slice(0, 12)}`;
  const pulls = api(`repos/${repository}/pulls?head=${repository.split('/')[0]}:${branch}&state=all`);
  if (pulls.length) { console.log(`Existing update: ${pulls[0].html_url}`); process.exit(0); }
  if (!optional(`repos/${repository}/git/ref/heads/${branch}`)) {
    const main = api(`repos/${repository}/git/ref/heads/main`);
    api(`repos/${repository}/git/refs`, 'POST', { ref: `refs/heads/${branch}`, sha: main.object.sha });
  }
  commitFiles(repository, branch, files, `Adopt platform ${revision.slice(0, 12)}`);
  const pull = api(`repos/${repository}/pulls`, 'POST', { title: `Adopt shared playbook platform ${revision.slice(0, 12)}`, head: branch, base: 'main', body: `Pinned platform: https://github.com/${source}/commit/${revision}\n\nOnly platform-owned files change. playbook.json, README.md, resources, instance docs, and source provenance are preserved. Binary brand assets are copied verbatim through the Git Blob API.\n\nReview workflow and dependency changes, run validation/browser checks, and confirm hosting privacy before merging. Revert this merge/commit to roll back the renderer without reverting later content edits.` });
  api(`repos/${repository}/actions/workflows/publish.yml/dispatches`, 'POST', { ref: 'main', inputs: { content_ref: branch } });
  console.log(pull.html_url);
}