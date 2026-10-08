import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import ipaddr from 'ipaddr.js';
import { marked } from 'marked';
import { loadCollection, safeUrl } from './content.mjs';
import { api } from './github.mjs';

export function publicAddress(address) {
  return ipaddr.isValid(address) && ipaddr.process(address).range() === 'unicast';
}

export function reviewState(value, now = new Date(), maxDays = 180) {
  if (!value) return 'unrecorded';
  const date = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'invalid-date';
  const days = (now.getTime() - date.getTime()) / 86400000;
  return days < 0 ? 'future-date' : days > maxDays ? 'stale' : 'current';
}

export async function checkLink(value, allowedHosts, redirects = 0) {
  safeUrl(value);
  const url = new URL(value);
  if (!allowedHosts.includes(url.hostname)) return { url: value, state: 'not-checked-host-unapproved' };
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(answer => !publicAddress(answer.address))) return { url: value, state: 'blocked-internal-or-special-address' };
  const pinned = addresses.find(answer => answer.family === 4) ?? addresses[0];
  const result = await new Promise((resolveResult, reject) => {
    const connection = request(url, {
      method: 'HEAD', timeout: 8000,
      headers: { 'User-Agent': 'CustomerValuePlaybook-LinkReview/0.1', Accept: '*/*' },
      lookup: (_hostname, options, callback) => options.all ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family),
    }, response => { response.resume(); resolveResult({ status: response.statusCode, location: response.headers.location }); });
    connection.on('timeout', () => connection.destroy(new Error('Link check timed out')));
    connection.on('error', reject);
    connection.end();
  });
  if (result.location && result.status >= 300 && result.status < 400) {
    const next = new URL(result.location, url);
    if (/login|signin|saml|authorize/i.test(`${next.hostname}${next.pathname}`)) return { url: value, state: 'authentication-destination', status: result.status };
    if (redirects >= 3) return { url: value, state: 'redirect-limit', status: result.status };
    const redirected = await checkLink(next.href, allowedHosts, redirects + 1);
    return { ...redirected, url: value, destination: redirected.url };
  }
  const state = result.status >= 200 && result.status < 300 ? 'reachable-not-content-verified' : [401, 403, 407].includes(result.status) ? 'authentication-or-policy-required' : result.status === 429 ? 'rate-limited-not-retried' : result.status === 405 ? 'head-not-supported' : result.status === 404 && url.hostname === 'github.com' ? 'not-found-or-private' : result.status >= 500 ? 'transient-server-failure' : 'not-found-or-unexpected-response';
  return { url: value, state, status: result.status };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { config, resources } = await loadCollection(process.env.PLAYBOOK_ROOT ?? process.cwd());
  const allowedHosts = config.maintenance?.allowedHosts ?? ['www.ni.com', 'ni.com', 'ni.github.io', 'github.com'];
  if (!Array.isArray(allowedHosts) || allowedHosts.some(host => typeof host !== 'string' || !/^[a-z0-9.-]+$/.test(host))) throw new Error('Maintenance host allowlist must contain literal approved DNS names');
  const urls = new Set();
  for (const resource of resources) {
    for (const link of resource.links ?? []) urls.add(link.url);
    if (resource.provenance?.url) urls.add(resource.provenance.url);
    marked.walkTokens(marked.lexer(resource.content), token => { if (['link', 'image'].includes(token.type) && token.href.startsWith('https://')) urls.add(token.href); });
  }
  const links = [];
  for (const url of [...urls].slice(0, 100)) {
    let result;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { result = await checkLink(url, allowedHosts); if (result.state !== 'transient-server-failure') break; }
      catch { result = { url, state: 'network-or-policy-unverified' }; }
    }
    links.push(result);
  }
  const reviews = resources.map(resource => ({ id: resource.id, owner: resource.owner, state: reviewState(resource.reviewDate) })).filter(resource => resource.state !== 'current');
  const report = { generatedAt: new Date().toISOString(), links, reviews, deferredLinks: Math.max(0, urls.size - 100), note: 'HEAD reachability is not proof of useful content or reader authorization. No cookies, tokens, or credentials are forwarded. Transient/authentication states are maintenance warnings, not publication gates.' };
  await mkdir('.generated', { recursive: true });
  await writeFile('.generated/maintenance.json', `${JSON.stringify(report, null, 2)}\n`);
  const clean = value => String(value).replace(/[`|\r\n]/g, ' ');
  const body = `One consolidated report, updated by the scheduled check.\n\n${report.note}\n\n## Link Review\n\n| Destination | State |\n| --- | --- |\n${links.map(link => `| ${clean(link.url)} | ${link.state}${link.status ? ` (${link.status})` : ''} |`).join('\n')}\n\n## Content Review\n\n| Resource | Owner | State |\n| --- | --- | --- |\n${reviews.map(resource => `| ${resource.id} | ${clean(resource.owner)} | ${resource.state} |`).join('\n')}\n\nDeferred beyond the bounded 100-link pass: ${report.deferredLinks}.\n\nGenerated: ${report.generatedAt}\n`;
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, body);
  if (process.env.GITHUB_REPOSITORY) {
    const endpoint = `repos/${process.env.GITHUB_REPOSITORY}/issues`;
    const title = 'Playbook Maintenance: Links and Review Dates';
    const existing = api(`${endpoint}?state=all&per_page=100`).find(issue => !issue.pull_request && issue.title === title);
    if (existing) api(`${endpoint}/${existing.number}`, 'PATCH', { body, state: 'open' });
    else api(endpoint, 'POST', { title, body });
  }
  console.log(`Consolidated maintenance: ${links.length} links, ${reviews.length} review flags. No publication state was changed.`);
}