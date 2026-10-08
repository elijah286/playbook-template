import { appendFile } from 'node:fs/promises';
import { loadCollection } from './content.mjs';
import { api, optional } from './github.mjs';

const { config, resources } = await loadCollection();
let deploy = false;
let site = '';
let state = 'Validated only: non-publishing branch.';
if (process.env.CONTENT_REF === 'main' && process.env.GITHUB_REF === 'refs/heads/main') {
  const repository = api(`repos/${process.env.GITHUB_REPOSITORY}`);
  if (!repository.private) throw new Error('Source repository must remain private');
  const pages = optional(`repos/${process.env.GITHUB_REPOSITORY}/pages`);
  if (!pages) state = 'Blocked: Pages is not configured. No public fallback has been created.';
  else {
    if (config.publication.mode === 'private' && pages.public !== false) throw new Error('Private publication requires verified access-controlled Pages. Personal public Pages is not an acceptable fallback.');
    if (config.publication.mode === 'public-demo' && config.publication.publicDemoApproved !== true) throw new Error('Public demo distribution has not been approved');
    const expected = `${config.site.origin}${config.site.base.endsWith('/') ? config.site.base : `${config.site.base}/`}`;
    if (pages.html_url !== expected) throw new Error(`Configured site does not match actual Pages destination: ${pages.html_url}`);
    deploy = true;
    site = pages.html_url;
    state = config.publication.mode === 'private' ? 'Verified private Pages boundary; deploy eligible.' : 'Explicit public-demo exception; source remains private.';
  }
}
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `deploy=${deploy}\nsite=${site}\n`);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Playbook Publication\n\n${state}\n\n${resources.length} published resources validated. Drafts and unapproved assets are excluded.\n`);
console.log(state);