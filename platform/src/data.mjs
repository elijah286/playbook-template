import { loadCollection, categories, audiences } from '../content.mjs';
import { loadSlidePreviews } from '../previews.mjs';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const { config, resources, playbooks, legacy } = await loadCollection(process.env.PLAYBOOK_ROOT ?? process.cwd());
const slidePreviews = await loadSlidePreviews(resources);
for (const resource of resources) resource.slides = slidePreviews[resource.id] ?? [];
export { categories, audiences };
export const base = `${config.site.base.replace(/\/$/, '')}/`;
export const href = route => `${base}${route.replace(/^\//, '')}`;
export const bookHref = (book, route = '') => book && !book.legacy ? href(`playbooks/${book.slug}/${route}`) : href(route);
export const resourceKey = resource => resource.playbook === null ? `shared--${resource.localId}` : resource.localId ?? resource.id;
export const resourceUrl = (resource, book = null) => book && !book.legacy ? bookHref(book, `resources/${resourceKey(resource)}/`) : href(`resources/${resource.id}/`);
export const getPlaybook = slug => playbooks.find(book => book.slug === slug);
export const searchDocuments = (collection, book = null) => collection.map(resource => ({ id: resource.id, title: resource.title, summary: resource.summary, type: resource.type, audiences: resource.audiences, categories: resource.categories, playbooks: resource.playbooks ?? [], url: resourceUrl(resource, book), body: plainText(resource.content), terms: [...resource.topics, ...resource.outcomes].join(' ') }));
export const assetUrl = resource => href(`assets/${resource.id}${resource.extension}`);
export const fileUrl = (resource, index) => href(`assets/${resource.id}-file-${index + 1}${resource.files[index].extension}`);
export const previewUrl = resource => resource.preview ? href(`assets/${resource.id}-preview${resource.preview.extension}`) : resource.slides?.length ? href(`assets/${resource.slides[0].image}`) : null;
export const slideUrls = resource => (resource.slides ?? []).map(slide => ({ image: href(`assets/${slide.image}`), thumbnail: href(`assets/${slide.thumbnail}`) }));
export const repositoryUrl = config.repository ? `https://github.com/${config.repository}` : null;
export const html = content => sanitizeHtml(marked.parse(content), {
  allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'pre', 'code', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br'],
  allowedAttributes: { a: ['href', 'title', 'rel'] },
  allowedSchemes: ['https'],
  allowProtocolRelative: false,
  transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer noopener' }) },
});
export const plainText = content => sanitizeHtml(html(content), { allowedTags: [], allowedAttributes: {} });