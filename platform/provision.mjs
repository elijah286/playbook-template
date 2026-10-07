import { readFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { api, optional, commitFiles } from './github.mjs';

export function provisionRequest(inputs, policy, actor) {
  if (!policy.owner || inputs.owner !== policy.owner || !policy.actors.includes(actor)) throw new Error('Target owner and initiating actor must be explicitly allowlisted by an administrator');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/.test(inputs.owner) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(inputs.repository) || inputs.repository.length > 80) throw new Error('Use a valid owner and a lowercase hyphenated repository name');
  if (!/^[a-z0-9-]{8,64}$/.test(inputs.request_id)) throw new Error('Keep a stable request_id of 8-64 lowercase letters, digits, or hyphens for safe retries');
  if (!inputs.name?.trim() || inputs.name.length > 200 || !inputs.value_thesis?.trim() || inputs.value_thesis.length > 2000) throw new Error('Name and customer value thesis are required');
  const inputIdentity = createHash('sha256').update(JSON.stringify([inputs.owner, inputs.repository, inputs.name, inputs.value_thesis])).digest('hex');
  return { target: `${inputs.owner}/${inputs.repository}`, marker: `Private customer value playbook [playbook:${inputs.request_id}]`, inputIdentity };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { inputs } = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const request = provisionRequest(inputs, { owner: process.env.PROVISION_ALLOWED_OWNER, actors: (process.env.PROVISION_ALLOWED_ACTORS ?? '').split(',').map(actor => actor.trim()) }, process.env.GITHUB_ACTOR);
  const template = process.env.PLATFORM_REPOSITORY || 'elijah286/playbook-template';
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(template) || template === request.target) throw new Error('Invalid clean template destination');
  const source = api(`repos/${template}`);
  if (!source.private || !source.is_template) throw new Error('The configured source must be the approved private clean template');
  const sourceTree = api(`repos/${template}/git/trees/${source.default_branch}?recursive=1`);
  if (sourceTree.truncated || sourceTree.tree.some(entry => entry.type === 'blob' && entry.path.startsWith('resources/') && !/(?:\/.gitkeep|\/_folder.json)$/.test(entry.path))) throw new Error('Template contains content; refusing to copy a populated playbook');
  let destination = optional(`repos/${request.target}`);
  if (destination && (!destination.private || destination.description !== request.marker)) throw new Error('Naming collision: existing repository does not belong to this request. Nothing was overwritten.');
  if (!destination) destination = api(`repos/${template}/generate`, 'POST', { owner: inputs.owner, name: inputs.repository, private: true, include_all_branches: false, description: request.marker });
  if (!destination.private) throw new Error('Provisioning stopped: generated repository is not private');
  const configFile = optional(`repos/${request.target}/contents/playbook.json`);
  if (!configFile) throw new Error('Repository created, but initial template content is not ready. Retry the same request_id; do not create a different repository.');
  const config = JSON.parse(Buffer.from(configFile.content, 'base64').toString('utf8'));
  if (config.provisioning && (config.provisioning.requestId !== inputs.request_id || config.provisioning.inputIdentity !== request.inputIdentity)) throw new Error('Retry inputs differ from the recorded request. Existing content was preserved.');
  api(`repos/${request.target}`, 'PATCH', { has_discussions: true });
  const pages = optional(`repos/${request.target}/pages`);
  if (pages && pages.public !== false) throw new Error('Target Pages is public. Provisioning will not weaken the private production default.');
  const site = pages ? new URL(pages.html_url) : null;
  const next = {
    ...config,
    name: inputs.name, description: inputs.value_thesis, valueThesis: inputs.value_thesis,
    repository: request.target, maintainer: process.env.GITHUB_ACTOR,
    publication: { mode: 'private', publicDemoApproved: false }, analytics: { enabled: false },
    site: site ? { origin: site.origin, base: site.pathname } : { origin: 'https://example.invalid', base: '/' },
    provisioning: { requestId: inputs.request_id, inputIdentity: request.inputIdentity, hosting: pages ? 'verified-private' : 'blocked-administrator-setup' },
  };
  if (!config.provisioning || JSON.stringify(config) !== JSON.stringify(next)) {
    const entry = pages ? `[Open the private playbook](${pages.html_url})` : `[Open the private repository and request hosting setup](https://github.com/${request.target})`;
    commitFiles(request.target, 'main', [
      { path: 'playbook.json', content: `${JSON.stringify(next, null, 2)}\n` },
      ...(!config.provisioning ? [{ path: 'README.md', content: `${entry}\n\n# ${inputs.name.replace(/[\r\n]/g, ' ')}\n\n${inputs.value_thesis}\n\nThis instance is private. ${pages ? 'Protected Pages was verified through the GitHub API.' : '**Website hosting is blocked** until an administrator configures and verifies access-controlled organization Pages. No public fallback is permitted.'}\n\n[Contributor Guide](docs/contributing.md) · [Resource Library Source](resources/) · [Private Discussions](https://github.com/${request.target}/discussions) · [Administrator Setup](docs/operations.md)\n` }] : []),
    ], 'Initialize private playbook configuration');
  }
  api(`repos/${request.target}/actions/workflows/publish.yml/dispatches`, 'POST', { ref: 'main', inputs: { content_ref: 'main' } });
  const report = `## Playbook Provisioning\n\nRepository: https://github.com/${request.target}\n\nDiscussions: https://github.com/${request.target}/discussions\n\n${pages ? `Verified protected website: ${pages.html_url}` : 'Blocked: access-controlled Pages needs enterprise organization administrator setup. The repository remains private and has no public fallback.'}\n\nRequest: ${inputs.request_id}. Repeating it is non-destructive; conflicting names or changed inputs stop. No collaborators were invited.\n`;
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report);
  console.log(report);
}