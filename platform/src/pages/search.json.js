import { resources, resourceUrl, plainText } from '../data.mjs';

export function GET() {
  return new Response(JSON.stringify(resources.map(resource => ({
    id: resource.id, title: resource.title, summary: resource.summary, type: resource.type,
    audiences: resource.audiences, categories: resource.categories, url: resourceUrl(resource),
    body: plainText(resource.content), terms: [...resource.topics, ...resource.outcomes].join(' '),
  }))), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}