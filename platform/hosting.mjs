import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadCollection } from './content.mjs';
import { api, optional } from './github.mjs';

export function publicationBoundary(config, repository, pages) {
  const approvedDemo = config.publication.mode === 'public-demo' && config.publication.publicDemoApproved === true;
  if (!repository.private && !approvedDemo) throw new Error('Source repository must remain private unless public demo distribution is explicitly approved');
  if (config.publication.mode === 'public-demo' && !approvedDemo) throw new Error('Public demo distribution has not been approved');
  if (!pages) return { deploy: false, site: '', state: 'Blocked: Pages is not configured. No public fallback has been created.' };
  if (config.publication.mode === 'private' && pages.public !== false) throw new Error('Private publication requires verified access-controlled Pages. Personal public Pages is not an acceptable fallback.');
  const expected = `${config.site.origin}${config.site.base.endsWith('/') ? config.site.base : `${config.site.base}/`}`;
  if (pages.html_url !== expected) throw new Error(`Configured site does not match actual Pages destination: ${pages.html_url}`);
  return { deploy: true, site: pages.html_url, state: config.publication.mode === 'private' ? 'Verified private Pages boundary; deploy eligible.' : `Explicit public-demo exception; source is ${repository.private ? 'private' : 'public'}.` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { config, resources } = await loadCollection();
  let result = { deploy: false, site: '', state: 'Validated only: non-publishing branch.' };
  if (process.env.CONTENT_REF === 'main' && process.env.GITHUB_REF === 'refs/heads/main') result = publicationBoundary(config, api(`repos/${process.env.GITHUB_REPOSITORY}`), optional(`repos/${process.env.GITHUB_REPOSITORY}/pages`));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `deploy=${result.deploy}\nsite=${result.site}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Playbook Publication\n\n${result.state}\n\n${resources.length} published resources validated. Drafts and unapproved assets are excluded.\n`);
  console.log(result.state);
}