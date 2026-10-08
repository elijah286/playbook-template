import { playbooks, searchDocuments } from '../../../data.mjs';

export function getStaticPaths() {
  return playbooks.filter(book => !book.legacy).map(book => ({ params: { slug: book.slug }, props: { book } }));
}

export function GET({ props: { book } }) {
  return new Response(JSON.stringify(searchDocuments(book.resources, book)), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}