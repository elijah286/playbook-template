import { loadPlaybook, categories, audiences } from '../content.mjs';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const { config, resources } = await loadPlaybook(process.env.PLAYBOOK_ROOT ?? process.cwd());
export { categories, audiences };
export const base = `${config.site.base.replace(/\/$/, '')}/`;
export const href = route => `${base}${route.replace(/^\//, '')}`;
export const resourceUrl = resource => href(`resources/${resource.id}/`);
export const assetUrl = resource => href(`assets/${resource.id}${resource.extension}`);
export const previewUrl = resource => resource.preview ? href(`assets/${resource.id}-preview${resource.preview.extension}`) : null;
export const repositoryUrl = config.repository ? `https://github.com/${config.repository}` : null;
export const html = content => sanitizeHtml(marked.parse(content), {
  allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'pre', 'code', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br'],
  allowedAttributes: { a: ['href', 'title', 'rel'] },
  allowedSchemes: ['https'],
  allowProtocolRelative: false,
  transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer noopener' }) },
});
export const plainText = content => sanitizeHtml(html(content), { allowedTags: [], allowedAttributes: {} });