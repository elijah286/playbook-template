import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { api, optional, commitFiles } from './github.mjs';

export function playbookDraft(inputs, maintainer) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(inputs.slug ?? '') || inputs.slug === 'shared' || inputs.slug.length > 80) throw new Error('Use a lowercase hyphenated playbook slug other than shared');
  if (!inputs.name?.trim() || inputs.name.length > 200 || !inputs.value_thesis?.trim() || inputs.value_thesis.length > 2000) throw new Error('A name and value thesis are required');
  const config = { name: inputs.name.trim(), description: inputs.value_thesis.trim(), valueThesis: inputs.value_thesis.trim(), maintainer, status: 'draft', featured: false, publicApproved: false };
  const files = [{ path: `playbooks/${inputs.slug}/playbook.json`, content: `${JSON.stringify(config, null, 2)}\n` }];
  for (const [folder, type] of [['guides', 'guide'], ['presentations', 'presentation'], ['emails', 'email-template'], ['code', 'technical-project'], ['videos', 'video']]) files.push({ path: `playbooks/${inputs.slug}/resources/${folder}/_folder.json`, content: `${JSON.stringify({ type, publicApproved: false }, null, 2)}\n` });
  const identity = createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0, 10);
  return { config, files, branch: `add-playbook-${inputs.slug}-${identity}` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { inputs } = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const repository = process.env.GITHUB_REPOSITORY;
  const permission = api(`repos/${repository}/collaborators/${process.env.GITHUB_ACTOR}/permission`).permission;
  if (!['write', 'maintain', 'admin'].includes(permission)) throw new Error('Creating a playbook requires repository write permission');
  if (!optional(`repos/${repository}/contents/hub.json`)) throw new Error('This workflow requires a hub configuration');
  const draft = playbookDraft(inputs, process.env.GITHUB_ACTOR);
  const pulls = api(`repos/${repository}/pulls?head=${repository.split('/')[0]}:${draft.branch}&state=all`);
  if (pulls.length) { console.log(`Already created: ${pulls[0].html_url}`); process.exit(0); }
  if (optional(`repos/${repository}/contents/playbooks/${inputs.slug}/playbook.json`)) throw new Error('This playbook already exists; its content was preserved');
  const existing = optional(`repos/${repository}/contents/playbooks/${inputs.slug}/playbook.json?ref=${draft.branch}`);
  if (existing && Buffer.from(existing.content, 'base64').toString('utf8') !== draft.files[0].content) throw new Error('The existing draft was edited; review it rather than overwriting it');
  if (!optional(`repos/${repository}/git/ref/heads/${draft.branch}`)) {
    const main = api(`repos/${repository}/git/ref/heads/main`);
    api(`repos/${repository}/git/refs`, 'POST', { ref: `refs/heads/${draft.branch}`, sha: main.object.sha });
  }
  if (!existing) commitFiles(repository, draft.branch, draft.files, `Prepare playbook: ${draft.config.name}`);
  const pull = api(`repos/${repository}/pulls`, 'POST', { title: `Add playbook: ${draft.config.name}`, head: draft.branch, base: 'main', body: 'New playbook and typed resource folders. Nothing is published while status is draft. Add approved resources, review the audience and value thesis, change status to published, and record public distribution approval only when appropriate. All playbooks share the hub access boundary.', draft: true });
  api(`repos/${repository}/actions/workflows/publish.yml/dispatches`, 'POST', { ref: 'main', inputs: { content_ref: draft.branch } });
  console.log(pull.html_url);
}