import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { audiences, categories, safeUrl } from './content.mjs';
import { api, optional, commitFiles } from './github.mjs';

export function submission(issue, submitterPermission, approverPermission) {
  if (![submitterPermission, approverPermission].every(permission => ['write', 'maintain', 'admin'].includes(permission))) throw new Error('Both submitter and approver must have repository write permission');
  if (!Number.isSafeInteger(issue.number) || issue.number < 1) throw new Error('Invalid issue number');
  const fields = Object.fromEntries((issue.body ?? '').split(/^### /m).slice(1).map(section => {
    const newline = section.indexOf('\n');
    return [section.slice(0, newline).trim(), section.slice(newline + 1).trim()];
  }));
  const title = fields['Resource Title'];
  const summary = fields.Summary;
  const audience = Object.entries(audiences).find(([, label]) => label === fields.Audience)?.[0];
  const category = Object.entries(categories).find(([, label]) => label === fields.Category)?.[0];
  if (!title || title.length > 200 || !summary || summary.length > 2000 || !audience || !category) throw new Error('Complete the supported resource form before conversion');
  const source = fields['Reference URL'];
  if (source && source !== '_No response_') safeUrl(source);
  const id = `request-${issue.number}`;
  return { id, content: `## ${title.replace(/[\r\n]/g, ' ')}\n\n${summary}\n`, metadata: { id, title, summary, type: 'reference', audiences: [audience], categories: [category], status: 'draft', publicApproved: false, owner: issue.user.login, links: source && source !== '_No response_' ? [{ title: 'Submitted reference', url: source }] : [] } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const repository = process.env.GITHUB_REPOSITORY;
  if (event.label?.name !== 'approved-resource') throw new Error('Conversion requires the approved-resource label');
  const issue = api(`repos/${repository}/issues/${event.issue.number}`);
  const author = api(`repos/${repository}/collaborators/${issue.user.login}/permission`).permission;
  const actor = api(`repos/${repository}/collaborators/${process.env.GITHUB_ACTOR}/permission`).permission;
  const result = submission(issue, author, actor);
  const branch = `playbook-request-${issue.number}`;
  const pulls = api(`repos/${repository}/pulls?head=${repository.split('/')[0]}:${branch}&state=all`);
  if (pulls.length) { console.log(`Already converted: ${pulls[0].html_url}`); process.exit(0); }
  if (!optional(`repos/${repository}/git/ref/heads/${branch}`)) {
    const main = api(`repos/${repository}/git/ref/heads/main`);
    api(`repos/${repository}/git/refs`, 'POST', { ref: `refs/heads/${branch}`, sha: main.object.sha });
  }
  commitFiles(repository, branch, [
    { path: `resources/requests/${result.id}.md`, content: result.content },
    { path: `resources/requests/${result.id}.md.resource.json`, content: `${JSON.stringify(result.metadata, null, 2)}\n` },
  ], `Convert resource request #${issue.number} into a draft`);
  const pull = api(`repos/${repository}/pulls`, 'POST', { title: `Review resource: ${result.metadata.title}`, head: branch, base: 'main', body: `Closes #${issue.number}\n\nGenerated only after submitter and approver write permissions were verified. This resource remains a draft. Review the original content, publication state, and distribution approval before publishing.`, draft: true });
  api(`repos/${repository}/issues/${issue.number}/comments`, 'POST', { body: `Converted into a draft for review: ${pull.html_url}. Nothing has been published. A maintainer must review the source, change status to published, approve public distribution when applicable, and merge.` });
  api(`repos/${repository}/actions/workflows/publish.yml/dispatches`, 'POST', { ref: 'main', inputs: { content_ref: branch } });
  console.log(pull.html_url);
}