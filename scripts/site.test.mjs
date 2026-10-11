import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { test } from 'node:test';
import { join } from 'node:path';

const output = new URL('../dist/', import.meta.url);
const base = `/${(process.env.PAGES_BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const sitePath = (path) => `${base}${path}`;
const diskPath = (path) => (base && path.startsWith(`${base}/`) ? path.slice(base.length) : path).replace(/^\//, '');
const read = (path) => readFile(new URL(diskPath(path), output), 'utf8');
const links = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map((match) => match[1]);
const nav = (html, name) => {
  const content = html.match(new RegExp(`<nav\\b[^>]*class="${name}"[^>]*>([\\s\\S]*?)</nav>`));
  assert.ok(content, `Missing ${name}`);
  return links(content[1]);
};

test('both homepages list ten poems in the same order and switch languages', async () => {
  const en = await read('index.html');
  const ru = await read('ru/index.html');
  assert.match(en, /<html\s+lang="en"/);
  assert.match(ru, /<html\s+lang="ru"/);
  const english = links(en).filter((href) => href.startsWith(sitePath('/poems/')));
  const russian = links(ru).filter((href) => href.startsWith(sitePath('/ru/poems/')));
  assert.equal(english.length, 10);
  assert.equal(new Set(english).size, 10);
  assert.deepEqual(russian, english.map((href) => sitePath(`/ru${href.slice(base.length)}`)));
  assert.deepEqual(nav(en, 'language-switch'), [sitePath('/ru/')]);
  assert.deepEqual(nav(ru, 'language-switch'), [sitePath('/')]);
});

test('every poem switches to its counterpart and navigates within its language', async () => {
  for (const lang of ['en', 'ru']) {
    const home = sitePath(lang === 'en' ? '/' : '/ru/');
    const poems = links(await read(`${home}index.html`)).filter((href) => href.startsWith(`${home}poems/`));
    for (const [index, href] of poems.entries()) {
      const page = await read(`${href}index.html`);
      assert.match(page, new RegExp(`<html\\s+lang="${lang}"`));
      assert.deepEqual(nav(page, 'menu'), [poems[index - 1], home, poems[index + 1]].filter(Boolean));
      const local = href.slice(base.length);
      const counterpart = sitePath(lang === 'en' ? `/ru${local}` : local.replace(/^\/ru/, ''));
      assert.deepEqual(nav(page, 'language-switch'), [counterpart]);
      for (const alternate of [href, counterpart]) {
        assert.ok(page.includes(`href="${alternate}"`), `Missing language alternate for ${href}`);
      }
      assert.ok(!page.includes('Draft English translation'));
      assert.match(page, /<h1>/);
    }
  }
});

test('legacy Russian and English review URLs redirect to the correct language', async () => {
  const originals = ['1-dozhdya', '2-omishah', '3-mibudem', '4-durshlag', '5-nas-ne-dolzhni', '6-poodinochke', '7-ti-ushla', '8-siniy-pidzhak', '9-toliveterpodul', '10-ugolki'];
  const poems = links(await read('index.html')).filter((href) => href.startsWith(sitePath('/poems/')));
  for (const [index, href] of poems.entries()) {
    const russian = await read(`poems/${originals[index]}.html`);
    assert.ok(russian.includes(`content="0;url=${sitePath(`/ru${href.slice(base.length)}`)}"`));
    const english = await read(`en${href.slice(base.length).replace(/\/$/, '.html')}`);
    assert.ok(english.includes(`content="0;url=${href}"`));
  }
  assert.ok((await read('en.html')).includes(`content="0;url=${sitePath('/')}"`));
  assert.match(await read('en/index.html'), /http-equiv="refresh"/);
});

test('all local links and assets resolve in the static output', async () => {
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else if (entry.name.endsWith('.html')) {
        const html = await readFile(path, 'utf8');
        for (const match of html.matchAll(/<(?:a|link|img)\b[^>]*?(?:href|src)="(\/[^"]*)"/g)) {
          const href = match[1];
          assert.ok(href.startsWith(`${base}/`), `Link escapes deployment path in ${path}: ${href}`);
          const target = new URL(diskPath(href), output);
          const info = await stat(target).catch(() => null);
          assert.ok(info, `Broken link in ${path}: ${href}`);
          if (info.isDirectory()) assert.ok((await stat(new URL(`${diskPath(href)}index.html`, output))).isFile());
        }
      }
    }
  }
  await inspect(output.pathname);
});
