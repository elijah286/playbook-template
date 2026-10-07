import { execFileSync } from 'node:child_process';

export function api(endpoint, method = 'GET', data) {
  const args = ['api', endpoint, '--method', method];
  if (data !== undefined) args.push('--input', '-');
  const output = execFileSync('gh', args, { input: data === undefined ? undefined : JSON.stringify(data), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  return output.trim() ? JSON.parse(output) : null;
}

export function optional(endpoint) {
  try { return api(endpoint); }
  catch (error) {
    let response;
    try { response = JSON.parse(error.stdout); } catch { throw error; }
    if (response.status === '404') return null;
    throw error;
  }
}

export function commitFiles(repository, branch, files, message) {
  const ref = api(`repos/${repository}/git/ref/heads/${branch}`);
  const parent = api(`repos/${repository}/git/commits/${ref.object.sha}`);
  const entries = files.map(file => {
    if (file.sha === null) return { path: file.path, mode: '100644', type: 'blob', sha: null };
    if (file.base64 !== undefined) {
      const blob = api(`repos/${repository}/git/blobs`, 'POST', { content: file.base64, encoding: 'base64' });
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
    }
    return { path: file.path, mode: '100644', type: 'blob', content: file.content };
  });
  const tree = api(`repos/${repository}/git/trees`, 'POST', { base_tree: parent.tree.sha, tree: entries });
  const commit = api(`repos/${repository}/git/commits`, 'POST', { message, tree: tree.sha, parents: [parent.sha] });
  api(`repos/${repository}/git/refs/heads/${branch}`, 'PATCH', { sha: commit.sha, force: false });
  return commit.sha;
}