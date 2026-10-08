import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationBoundary } from '../hosting.mjs';

const config = { publication: { mode: 'private', publicDemoApproved: false }, site: { origin: 'https://private.pages.github.io', base: '/' } };
const pages = { public: false, html_url: 'https://private.pages.github.io/' };

test('private deployment requires private source and positively verified private Pages', () => {
  assert.equal(publicationBoundary(config, { private: true }, pages).deploy, true);
  assert.throws(() => publicationBoundary(config, { private: false }, pages), /Source repository/);
  assert.throws(() => publicationBoundary(config, { private: true }, { ...pages, public: true }), /access-controlled/);
  assert.throws(() => publicationBoundary(config, { private: true }, { html_url: pages.html_url }), /access-controlled/);
});

test('missing Pages never enables a public fallback', () => {
  const result = publicationBoundary(config, { private: true }, null);
  assert.equal(result.deploy, false);
  assert.equal(result.site, '');
});

test('only an explicitly approved public demo permits public source publication', () => {
  const demo = { ...config, publication: { mode: 'public-demo', publicDemoApproved: true } };
  assert.equal(publicationBoundary(demo, { private: false }, { ...pages, public: true }).deploy, true);
  assert.equal(publicationBoundary(demo, { private: true }, { ...pages, public: true }).deploy, true);
  assert.throws(() => publicationBoundary({ ...demo, publication: { mode: 'public-demo', publicDemoApproved: false } }, { private: false }, pages), /explicitly approved/);
  assert.throws(() => publicationBoundary({ ...demo, publication: { mode: 'public-demo', publicDemoApproved: false } }, { private: true }, pages), /not been approved/);
});

test('publishing cannot substitute a different website destination', () => {
  assert.throws(() => publicationBoundary(config, { private: true }, { ...pages, html_url: 'https://other.pages.github.io/' }), /actual Pages destination/);
});