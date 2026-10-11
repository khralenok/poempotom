import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { preview } from 'astro';
import { chromium } from 'playwright';

// Run after `npm run build`. The owned preview and browser are closed on completion.
let server;
let browser;
let page;
const measurements = [];
const output = new URL('../test-results/layout/', import.meta.url);

before(async () => {
  await mkdir(output, { recursive: true });
  server = await preview({ logLevel: 'silent', server: { host: '127.0.0.1', port: 4322 } });
  browser = await chromium.launch();
  page = await browser.newPage();
});

after(async () => {
  try {
    await writeFile(new URL('measurements.json', output), `${JSON.stringify(measurements, null, 2)}\n`);
    await browser?.close();
  } finally {
    await server?.stop();
  }
});

const sizes = [
  [320, 568], [360, 640], [390, 844], [479, 800], [480, 800], [481, 800],
  [540, 960], [639, 900], [640, 960], [641, 960], [759, 1000], [760, 1000], [761, 1000], [768, 1024], [820, 1180],
  [959, 1100], [960, 1100], [961, 800], [1024, 768], [1199, 800], [1200, 800],
  [1201, 800], [1280, 800], [1440, 900], [568, 320], [667, 375], [844, 390],
  [932, 430], [640, 360], [280, 653], [720, 450],
];
const paths = ['/', '/ru/', '/poems/rain/', '/poems/blue-jacket/', '/ru/poems/you-have-gone/', '/poems/parting/', '/404.html'];
const screenshots = new Set([
  '481x800 /', '540x960 /poems/rain/', '768x1024 /', '844x390 /poems/rain/',
  '1440x900 /poems/rain/', '390x844 /poems/blue-jacket/', '1440x900 /', '320x568 /',
]);

async function visit(path) {
  const response = await page.goto(`${server.urls.local[0]}${path.replace(/^\//, '')}`, { waitUntil: 'load' });
  assert.equal(response.status(), 200, path);
  await page.evaluate(() => document.fonts.ready);
}

async function checkPoem(label) {
  const flow = await page.evaluate(() => {
    const pane = document.querySelector('.poem-container');
    const article = document.querySelector('article');
    return {
      documentScrolls: getComputedStyle(document.body).overflow !== 'hidden',
      noNestedScroll: !['auto', 'scroll'].includes(getComputedStyle(pane).overflowY),
      horizontalOverflow: article.scrollWidth - article.clientWidth,
      title: document.querySelector('h1').textContent.trim(),
      navigationAfterVerse: document.querySelector('.menu').getBoundingClientRect().top >= article.getBoundingClientRect().bottom,
    };
  });
  assert.ok(flow.documentScrolls && flow.noNestedScroll, `${label}: nested or blocked scrolling`);
  assert.ok(flow.horizontalOverflow <= 1, `${label}: horizontal poem overflow`);
  assert.ok(flow.title && flow.navigationAfterVerse, `${label}: missing title or overlapping navigation`);
  for (const end of [false, true]) {
    const result = await page.evaluate((end) => {
      const article = document.querySelector('article');
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
      const node = end ? nodes.at(-1) : nodes[0];
      node.parentElement.scrollIntoView({ block: end ? 'end' : 'start' });
      const range = document.createRange();
      range.setStart(node, end ? node.length - 1 : 0);
      range.setEnd(node, end ? node.length : 1);
      const r = range.getBoundingClientRect();
      return { visible: r.x >= -1 && r.right <= innerWidth + 1 && r.y >= -1 && r.bottom <= innerHeight + 1,
        unobscured: article.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
    }, end);
    measurements.push({ label, boundary: end ? 'last' : 'first', ...result });
    assert.ok(result.visible && result.unobscured, `${label}: verse boundary unreachable`);
  }
  for (const control of await page.locator('.menu a, .language-switch a, .wordmark').all()) {
    await control.scrollIntoViewIfNeeded();
    const result = await control.evaluate(link => {
      const r = link.getBoundingClientRect();
      return r.width >= 44 && r.height >= 44 && link.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    assert.ok(result, `${label}: navigation too small or covered`);
  }
}

for (const [width, height] of sizes) {
  test(`layout at ${width} × ${height}`, async () => {
    await page.setViewportSize({ width, height });
    for (const path of paths) {
      await visit(path);
      const label = `${width}x${height} ${path}`;
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${label}: horizontal page overflow`);
      if (screenshots.has(label)) {
        const name = `${width}x${height}-${path.replaceAll('/', '-').replace(/^-|-$/g, '') || 'home'}`;
        await page.screenshot({ path: new URL(`${name}.png`, output).pathname });
      }
      if (await page.locator('article').count()) {
        await checkPoem(label);
        if (screenshots.has(label)) {
          const name = `${width}x${height}-${path.replaceAll('/', '-').replace(/^-|-$/g, '') || 'home'}`;
          await page.screenshot({ path: new URL(`${name}-end.png`, output).pathname });
        }
      } else {
        const links = page.locator('main a');
        if (path === '/' || path === '/ru/') assert.equal(await page.locator('.poems-list a').count(), 10);
        for (const link of await links.all()) {
          await link.scrollIntoViewIfNeeded();
          const reachable = await link.evaluate((element) => {
            // Wrapped inline links have multiple painted rectangles. The center
            // of their combined bounding box can be empty space between lines.
            const rects = [...element.getClientRects()];
            return rects.length > 0 && rects.every((r) => r.x >= 0 && r.right <= innerWidth + 1 && r.y >= 0 && r.bottom <= innerHeight + 1)
              && rects.some((r) => element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)));
          });
          assert.ok(reachable, `${label}: unreachable link ${await link.getAttribute('href')}`);
        }
      }
    }
  });
}

test('all twenty poems have unobscured beginnings and endings on mobile and desktop', async () => {
  const slugs = ['rain', 'mice', 'we-will-be', 'thoughts', 'go-away', 'apart', 'you-have-gone', 'blue-jacket', 'not-a-poet', 'parting'];
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const lang of ['en', 'ru']) for (const slug of slugs) {
      const path = `${lang === 'ru' ? '/ru' : ''}/poems/${slug}/`;
      await visit(path);
      await checkPoem(`${width}x${height} ${path}`);
    }
  }
});

test('keyboard scrolling and navigation work without pointer interaction', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit('/poems/mice/');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('class'), 'wordmark');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('hreflang'), 'ru');
  await page.keyboard.press('Escape');
  await page.locator(':focus').evaluate(element => element.blur());
  await page.keyboard.press('PageDown');
  await page.waitForFunction(() => window.scrollY > 0);
  await page.keyboard.press('Control+End');
  await page.keyboard.press('End');
  await page.waitForFunction(() => window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2);
  for (const id of ['previous', 'home', 'next']) {
    await page.locator(`#${id}`).focus();
    assert.equal(await page.locator(':focus').getAttribute('id'), id);
    const href = await page.locator(`#${id}`).getAttribute('href');
    await Promise.all([
      page.waitForURL(url => url.pathname === href),
      page.keyboard.press('Enter'),
    ]);
    assert.equal(new URL(page.url()).pathname, href);
    await visit('/poems/mice/');
  }
});
