import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPlaybook } from './content.mjs';

const { resources, config } = await loadPlaybook(process.env.PLAYBOOK_ROOT ?? process.cwd());
const origin = process.env.SITE_URL ?? `http://127.0.0.1:4321${config.site.base}`;
const directory = resolve('.generated/evidence');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const issues = [];
const externalRequests = [];
page.on('pageerror', error => issues.push(error.message));
page.on('request', request => { if (new URL(request.url()).origin !== new URL(origin).origin) externalRequests.push(request.url()); });
const representative = ['presentation', 'demonstration', 'guide', 'technical-project'].map(type => resources.find(resource => resource.type === type)).filter(Boolean);
const routes = ['', 'library/', 'paths/?audience=fae', ...representative.map(resource => `resources/${resource.id}/`), 'community/', 'contribute/'];
const results = [];
let accessibilityChecks = 0;
try {
  for (const width of [375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    for (const route of routes) {
      const response = await page.goto(new URL(route, origin).href);
      assert.equal(response.status(), 200, route);
      if (route.startsWith('library')) await page.waitForFunction(() => document.querySelector('.library-layout')?.dataset.ready === 'true');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: ${route} overflow`);
      for (const image of await page.locator('.brand-logo').all()) {
        assert.equal(await image.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          return element.complete && element.naturalWidth === 344 && Math.abs(bounds.width / bounds.height - element.naturalWidth / element.naturalHeight) < 0.002 && getComputedStyle(element).filter === 'none';
        }), true, 'Original NI image must load without distortion or filters');
      }
      const key = route.replace(/[^a-z0-9]+/gi, '-') || 'overview';
      await page.screenshot({ path: resolve(directory, `${width}-${key}.png`), fullPage: true });
      let violations = [];
      if ([375, 1440].includes(width)) { violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations; accessibilityChecks++; }
      results.push({ width, route, overflow: false, violations: violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => node.target) })) });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(new URL('library/', origin).href);
  await page.waitForFunction(() => document.querySelector('.library-layout')?.dataset.ready === 'true');
  const target = resources.find(resource => resource.type === 'presentation') ?? resources[0];
  if (target) {
    await page.locator('#resource-search').fill(target.title);
    assert((await page.locator('#resource-results').innerText()).includes(target.title));
    await page.locator(`input[name=type][value="${target.type}"]`).check();
    assert.equal(new URL(page.url()).searchParams.get('type'), target.type);
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.library-layout')?.dataset.ready === 'true');
    assert.equal(await page.locator(`input[name=type][value="${target.type}"]`).isChecked(), true);
  }
  await page.locator('#resource-search').fill('this-termbelongsnowhere-937');
  assert.equal(await page.locator('#no-results').isVisible(), true);
  await page.locator('#no-results button').click();
  assert.equal(await page.locator('#resource-results article').count(), resources.length);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('.filter-toggle').click();
  assert.equal(await page.locator('.filter-sidebar').isVisible(), true);
  await page.screenshot({ path: resolve(directory, '375-open-filters.png'), fullPage: true });
  await page.locator('.mobile-toggle').click();
  assert.equal(await page.locator('#mobile-nav').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobile-nav').isVisible(), false);
  await page.goto(origin);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip').evaluate(element => element === document.activeElement), true);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
  await page.locator('h1').evaluate(element => { element.textContent = 'Responsibility Boundaries Across Distributed Measurement and Automation Systems'; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(issues, []);
  assert.deepEqual(externalRequests, [], 'Analytics-disabled pages must make no third-party requests');
  assert.equal(results.flatMap(result => result.violations).length, 0, JSON.stringify(results.filter(result => result.violations.length)));
} finally {
  await writeFile(resolve(directory, 'browser-report.json'), `${JSON.stringify({ results, accessibilityChecks, issues, externalRequests }, null, 2)}\n`);
  await browser.close();
}
console.log(`Passed ${results.length} responsive views, ${accessibilityChecks} axe checks, search/filter persistence, mobile navigation, keyboard entry, long titles, original NI imagery, and zero third-party requests. Evidence: ${directory}`);