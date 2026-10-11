# Поем потом

Static poetry website built with Astro. English is primary at `/`; Russian is available at `/ru/`. Both versions contain all ten poems.

## Development

Use Node.js 22.12+ (or a supported newer release).

```sh
npm install
npm run dev
```

`npm run check` checks Astro and TypeScript. `npm run build` produces the static site in `dist/`; `npm test` verifies the built pages, navigation, language switches, and compatibility redirects. `npm run preview` serves that build. Deploy the contents of `dist/`, not the source checkout.

For browser layout checks, install the test browser once, then run against a fresh build:

```sh
npx playwright install chromium
npm run build
npm run test:layout
```

The layout tests start and stop their own local preview server, check portrait and landscape screens on both sides of the responsive breakpoints, verify every poem's beginning and ending, and exercise keyboard scrolling. Screenshots and measurements are written to the ignored `test-results/layout/` directory.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` builds, checks, and deploys on pushes to `main`, or through **Actions → Deploy to GitHub Pages → Run workflow**. It uses Node.js 24 and installs the locked dependencies with `npm ci`. Failed type checks, builds, or integration tests prevent deployment.

In the repository's **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. Push this project's source files, including the workflow and lockfile, to `main`. GitHub Pages supplies the site origin and base path automatically, supporting both `/poempotom/` project hosting and a custom domain configured in Pages settings.

Local development keeps `/` as the root. To verify a project-path build locally:

```sh
SITE_URL=https://khralenok.github.io PAGES_BASE_PATH=/poempotom npm run build
PAGES_BASE_PATH=/poempotom npm test
PAGES_BASE_PATH=/poempotom npm run preview
```

Open `/poempotom/` on the preview server. Rebuild without these variables before running the normal layout suite. Routes, illustration paths, language links, and legacy redirects all respect the deployment base path. Browser screenshots and earlier migration/audit reports are disposable review artifacts and are not retained in the source tree.

## Poems

Edit Markdown files in `src/content/poems/ru/` and `src/content/poems/en/`. Frontmatter is validated by `src/content.config.ts`.

- `poemId`: shared stable ID for the Russian and English versions.
- `title`: page title; optional `listTitle` preserves an existing homepage label.
- `lang`: `ru` or `en`.
- `order`: position in the collection and previous/next navigation.
- `slug`: shared URL slug used by both language versions.
- `legacySlug`: original Russian filename without `.html`, required for Russian entries.
- `illustration`: absolute path to the shared SVG in `public/img/`.

Single line breaks are preserved by `remark-breaks`. Separate stanzas with an empty line and use `*italics*` for emphasis. Escape a leading dash followed by a space as `\- ` to keep it as verse rather than a Markdown list.

The homepage and previous/next links are generated from each language's entries. Navigation stops at the collection boundaries and appears after the verse, with adjacent poem titles and an All poems link. English poems use `/poems/<slug>/`; Russian poems use `/ru/poems/<slug>/`. Language switches pair versions by `poemId`, and alternate-language links are included in page metadata.

The original Russian `/poems/<legacySlug>.html` URLs redirect to their Russian counterparts. The earlier English review URLs `/en/poems/<slug>.html`, `/en.html`, and `/en/` redirect to the primary English pages. These are static HTML refresh redirects with fallback links, requiring no server-specific rules. `/index.html` remains the English homepage in the static build.

## Illustrations

Edit the original SVGs in `assets/illustrations/`, then run `npm run optimize:illustrations` to regenerate the files in `public/img/`. Commit both the originals and the generated files. The favicon is independent of this process.

SVGO removes redundant markup while preserving path geometry, transforms, numeric precision, IDs, and viewBoxes. Image paths and dimensions remain unchanged. The twelve exports total 403,441 bytes (5.4% smaller than the originals), or 149,150 bytes with gzip (1.6% smaller). All twelve matched the originals pixel-for-pixel at 320, 600, and 1200 px. Actual transfer sizes depend on host compression.

## Content notes

There are ten Russian originals and ten English versions. Poems 08 (“Blue Jacket”) and 09 (“Not a Poet”) now contain the completed translations supplied by the author, and their draft markers have been removed.

The English version 06, “Apart,” differs substantially from the existing Russian page, including its dedication and subsequent passages. Both supplied texts are preserved; their pairing still needs editorial review. Existing differences between Russian homepage labels and page titles are preserved as `listTitle` and `title`.

The shared header uses a typographic wordmark with an orange accent. Oswald is used for headings and the wordmark; Open Sans is used for verse and navigation. Fonts are loaded through Google Fonts, with local sans-serif fallbacks. The dark homepage pairs its illustration with a single ordered table of contents. White poem pages show a visible title and scroll as normal documents; on mobile the title and a modest illustration precede the verse.
