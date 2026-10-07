import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAddress, reviewState, checkLink } from '../maintenance.mjs';

test('link checks reject internal, mapped, and special addresses', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '::1', '::ffff:127.0.0.1', 'fe80::1', 'fc00::1', '203.0.113.1']) assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress('1.1.1.1'), true);
  assert.equal(publicAddress('2606:4700:4700::1111'), true);
});
test('unapproved destinations are never requested', async () => {
  assert.equal((await checkLink('https://unapproved.example/resource', ['www.ni.com'])).state, 'not-checked-host-unapproved');
});
test('review flags distinguish stale, absent, invalid, and future dates', () => {
  const now = new Date('2026-10-07T00:00:00Z');
  assert.equal(reviewState(null, now), 'unrecorded');
  assert.equal(reviewState('2026-02-30', now), 'invalid-date');
  assert.equal(reviewState('2027-01-01', now), 'future-date');
  assert.equal(reviewState('2025-01-01', now), 'stale');
  assert.equal(reviewState('2026-10-01', now), 'current');
});