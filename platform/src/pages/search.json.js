import { resources, searchDocuments } from '../data.mjs';

export function GET() {
  return new Response(JSON.stringify(searchDocuments(resources)), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}