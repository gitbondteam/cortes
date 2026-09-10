# Cortes Argentinos — sitio institucional y catálogo

Static brand site and product catalogue for **Cortes Argentinos — Maestros de la
Carne**, a chain of butcher shops in Jesús María, Córdoba.

**This is a catalogue and brand site, not an online store.** There is no cart,
no checkout, no payments and no accounts. Product enquiries go to WhatsApp.

---

## Table of contents

1. [Overview](#overview)
2. [Tech stack](#tech-stack)
3. [Install](#install)
4. [Local development](#local-development)
5. [Production build](#production-build)
6. [Project structure](#project-structure)
7. [How to add a product](#how-to-add-a-product)
8. [How to add a category](#how-to-add-a-category)
9. [How to replace product images](#how-to-replace-product-images)
10. [How to change business information](#how-to-change-business-information)
11. [How to enable catalogue prices](#how-to-enable-catalogue-prices)
12. [How to enable franchise content](#how-to-enable-franchise-content)
13. [Design system](#design-system)
14. [Regenerating assets from the PDFs](#regenerating-assets-from-the-pdfs)
15. [GitHub workflow](#github-workflow)
16. [Deployment](#deployment)

---

## Overview

| | |
| --- | --- |
| Pages | 38 static pages |
| Products | 33, from `src/data/products.ts` |
| Categories | 3 (Vacunos, Cerdo, Embutidos y elaborados) |
| Language | Argentine Spanish (`es-AR`, voseo) |
| Output | Fully static HTML in `dist/` |
| Client JS | ~3 KB, only for the mobile menu, catalogue filters and scroll reveal |
| Total assets | ~2.1 MB across the whole site (any single page loads far less) |

Routes:

```
/                        Home
/catalogo/               Full catalogue with category filters + search
/catalogo/<slug>/        Product detail  (33 pages)
/nosotros/               About
/contacto/               Contact
/404                     Custom not-found page
/franquicias/            Franchise page — built but disabled by default
/robots.txt              Generated
/sitemap-index.xml       Generated
```

Content provenance, copy corrections and everything deliberately left
unpublished are documented in **[CONTENT_NOTES.md](./CONTENT_NOTES.md)**.
Read it before changing any copy.

---

## Tech stack

- **[Astro](https://astro.build)** 7 — static output, zero client framework
- **TypeScript** (strict)
- **Modern CSS** — custom properties, `clamp()`, grid, container-free scoped
  component styles. No Tailwind, no Bootstrap, no CSS framework.
- **Vanilla JS**, progressively enhanced. Every page is fully usable with
  JavaScript disabled.
- **`@astrojs/sitemap`** — the only integration.
- **Self-hosted fonts** — Cairo, Oswald, Playfair Display (latin subset,
  5 files, 160 KB total). No external font requests, no third-party scripts, no
  analytics, no cookies.

---

## Install

Requires **Node.js 22.12 or newer**.

```bash
npm install
```

---

## Local development

```bash
npm run dev
```

Opens on <http://localhost:4321>. Edits hot-reload.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run build:fast` | Build without the type-check (use in a hurry) |
| `npm run preview` | Serve the built `dist/` locally, exactly as it will ship |
| `npm run check` | Astro + TypeScript diagnostics only |

Always run `npm run preview` before deploying — it serves the real static output
rather than the dev server.

---

## Production build

```bash
npm run build
```

Runs `astro check` first, so the build fails on any TypeScript or template
error. Output goes to **`dist/`**, which is what gets uploaded.

The build also validates the catalogue: duplicate slugs, unknown categories,
missing alt text, bad image paths and invalid prices all throw at build time
rather than shipping broken.

---

## Project structure

```
src/
  components/
    Breadcrumbs.astro      Breadcrumb trail
    Footer.astro           Site footer
    Header.astro           Sticky header + accessible mobile menu
    Hero.astro             Homepage hero
    LocationBlock.astro    Address / phone / Instagram block
    Logo.astro             The brand lockup (SVG, three variants)
    ProductCard.astro      One catalogue tile
    ProductFilters.astro   Category chips + search (all the filter JS)
    ProductGrid.astro      Responsive product grid
    SEOHead.astro          Titles, meta, OG, canonical, JSON-LD, preloads
    SectionHeading.astro   Eyebrow + display heading + red rule
    SocialLinks.astro      Social icons
    WhatsAppButton.astro   Enquiry CTA

  layouts/
    BaseLayout.astro       html/head/body shell, header, footer, reveal script

  pages/
    index.astro
    nosotros.astro
    contacto.astro
    404.astro
    robots.txt.ts
    catalogo/
      index.astro          Catalogue listing
      [slug].astro         One static page per product
    franquicias/
      [...slug].astro      Feature-flagged franchise page

  data/                    ← all content and configuration lives here
    site.ts                Business info + feature flags (single source of truth)
    products.ts            The 33 products
    categories.ts          The taxonomy
    nav.ts                 Navigation items
    franchise.ts           Franchise copy (unpublished by default)

  lib/
    catalog.ts             Validation, sorting, filtering, price formatting
    whatsapp.ts            wa.me link + message builders
    schema.ts              JSON-LD builders

  styles/
    tokens.css             Every design token
    global.css             Reset, typography, layout primitives, utilities

public/                    ← copied to dist/ verbatim
  brand/                   Vector logo variants + brush-edge masks
  products/                33 product cut-outs (WebP)
  images/                  Photography, texture tile, OG card
  fonts/                   Self-hosted woff2
  favicon/                 Favicons
  .htaccess                404, HTTPS, caching, compression (see deployment doc)

_source/                   The two original PDFs (reference only, never shipped)
_work/                     Asset-extraction + QA scripts (not part of the build)
```

The separation to preserve:

- **`src/data/`** — content and configuration. Editable without touching layout.
- **`src/components/` + `src/layouts/`** — presentation only.
- **`src/lib/`** — logic, no markup.
- **`public/`** — assets.

---

## How to add a product

Two steps, no layout changes.

**1. Add the image** at `public/products/<slug>.webp`

Square, transparent background, ideally 420 × 420 or larger. See
[replacing product images](#how-to-replace-product-images) for the recipe.

**2. Add the record** to `src/data/products.ts`

```ts
{
  id: 'bondiola',
  slug: 'bondiola',                         // lowercase ASCII + hyphens only
  name: 'Bondiola',
  category: 'cerdo',                        // must exist in categories.ts
  presentation: '1,5 kg aprox.',            // optional
  image: '/products/bondiola.webp',
  imageAlt: 'Bondiola de cerdo sobre fondo blanco',
  price: 24500,                             // optional, ARS per kilo
  priceUnit: 'kg',
  featured: false,                          // true = shown on the homepage
  tags: [],                                 // optional
},
```

That's it. The product now appears in the catalogue, gets its own page at
`/catalogo/bondiola/`, is included in the category filter and its count, is
picked up by "related products", and lands in the sitemap.

The build **fails loudly** on a duplicate slug, an unknown category, missing alt
text or a bad image path — so mistakes never reach production.

> Slugs must be ASCII. Use `entrana`, not `entraña`; `picana`, not `picaña`.

---

## How to add a category

Add one entry to `src/data/categories.ts`:

```ts
{
  id: 'aves',
  name: 'Aves',
  blurb: 'Pollo y otras aves, listos para el horno o la parrilla.',
},
```

Then set `category: 'aves'` on the relevant products.

No new pages or components are needed. The filter chip, its product count, the
homepage category card, the breadcrumbs and the related-products logic all read
from this list. A category with no products is automatically hidden.

---

## How to replace product images

The photos currently on the site were extracted from the price-list PDF, which
embeds them at only 146–256 px. Replacing them with the original photography is
the single biggest quality win available, and it needs **no code change** —
just overwrite the files.

For each product, produce `public/products/<slug>.webp`:

1. Cut the product out on a transparent background.
2. Trim to the subject, then pad to a **square** canvas with ~2 % margin.
3. Export **WebP with alpha**, 420 × 420 or larger (840 × 840 for retina),
   quality ~85. Aim for under 60 KB per file.
4. Keep the filename exactly matching the product's `slug`.

Square canvases matter: every card reserves the same box, so the grid never
shifts while images load.

If you have the originals as a folder, `_work/build_assets.py` has a
`build_products()` function that does steps 2–3 in bulk.

---

## How to change business information

Everything lives in **`src/data/site.ts`**. Change it once; it updates the
header, footer, contact page, every WhatsApp link, the JSON-LD and the meta
tags.

```ts
phoneDisplay: '+54 9 3525 414150',   // shown to people
phoneE164:    '5493525414150',       // used by tel: and wa.me — digits only
address: { street: 'Salta 633', city: 'Jesús María', region: 'Córdoba', … },
social: {
  instagramUrl: 'https://www.instagram.com/cortesargentinos.arg/',
  facebookUrl:  null,                // set a real URL to show the Facebook icon
},
```

The phone number and address appear in **no other file**. Do not hard-code them
in a component.

**Adding the Facebook link:** set `social.facebookUrl` to the real page URL. The
icon appears in the footer and contact page, and the URL is added to the
`LocalBusiness` `sameAs` array. It is `null` today because the source material
gives a page *name* but no address — see CONTENT_NOTES.md §6.

---

## How to enable catalogue prices

All 33 prices are already stored in `src/data/products.ts`. They are hidden.

In `src/data/site.ts`:

```ts
catalog: {
  showPrices: true,   // ← was false
},
```

Rebuild. That single flag:

- shows the red price pill on every catalogue card,
- adds a **Precio** row to every product page,
- adds `Offer` data to the product JSON-LD.

With it off, no price is emitted into the HTML at all — it is not merely hidden
with CSS — and no `Offer` node is published. The layout is byte-for-byte
identical in height either way, so switching it never shifts anything.

> The prices came from an undated PDF. Verify them before turning this on.

---

## How to enable franchise content

The franchise page is fully built and ready. In `src/data/site.ts`:

```ts
features: {
  franchises: true,   // ← was false
},
```

Rebuild. `/franquicias/` is emitted and a **Franquicias** link appears in the
header, mobile menu and footer.

While the flag is `false` the route produces no file at all, so nothing is
reachable or indexable. Copy lives in `src/data/franchise.ts`.

---

## Design system

All tokens are in **`src/styles/tokens.css`** — colours, type scale, spacing,
radii, containers, shadows and motion. Use them; avoid one-off values.

The palette was sampled from the source PDFs rather than guessed:

| Token | Value | Sampled from |
| --- | --- | --- |
| `--color-bg` | `#1b1b1b` | the concrete texture |
| `--color-bg-deep` | `#101010` | the flat panel behind the brochure cover |
| `--color-red` | `#c41f23` | the "SOMOS" / "HACEMOS" headings |
| `--color-red-soft` | `#c63b3f` | the price pills in the catalogue |
| `--color-cream` | `#dab794` | "¿DÓNDE ESTAMOS?" and "ES NUESTRO ARTE" |

Typography: **Playfair Display** for display headings, **Oswald** for condensed
uppercase (nav, buttons, product names), **Cairo** for body — Cairo is the
brochure's actual font. Sizes use `clamp()` and scale fluidly.

Two accessibility rules baked into the system, worth knowing before you change
colours:

- **Brand red is display-only.** `#c41f23` cannot reach 4.5:1 against charcoal
  at body sizes, so red is reserved for large headings and filled buttons
  (white on red passes). Small accent text uses `--color-cream`.
- `--color-text-faint` is the floor. It is tuned to pass AA on every charcoal
  in the ladder; don't darken it.

The charcoal texture is one 39 KB tile (`--texture-url`) applied with the
`.textured` class. It is baked as black-with-alpha grain, so it composites onto
whatever `background-color` the element already has — no blend modes.

---

## Regenerating assets from the PDFs

Not needed for normal work; the finished assets are committed. If you ever need
to re-derive them:

```bash
python3 _work/build_assets.py     # needs pymupdf, pillow, numpy
```

Reads `_work/extract/` and `_work/products.json`, writes `public/brand/`,
`public/products/` and `public/images/`.

`_work/` also holds the QA tooling used to build this site:

```bash
node _work/shot.mjs _work/shots   # full-page screenshots at 7 widths,
                                  # plus an overflow + touch-target audit
node _work/audit.mjs              # accessibility, contrast, heading order, SEO
```

Both drive headless Chrome over CDP and need the dev server running. `_work/` is
excluded from the build.

---

## GitHub workflow

No git remote is configured — create the repository yourself.

```bash
git init
git add .
git commit -m "Cortes Argentinos website"
git branch -M main
git remote add origin git@github.com:<your-user>/<your-repo>.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `dist/` and `.astro/`.

Suggested rhythm:

- `main` is what production serves.
- Content-only changes (a new product, a price, a phone number) touch
  `src/data/` and nothing else — they are safe to commit directly.
- Anything else goes through a branch and a PR.
- Run `npm run build` before pushing; it type-checks and validates the
  catalogue.

**Should `dist/` be committed?** Normally no. Commit it only if you plan to
deploy by pulling the repo directly on the server without a build step — see the
deployment doc.

---

## Deployment

Target is **Hostinger Business**. Full instructions, including the exact build
command, output directory and how to connect the GitHub repository, are in
**[HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md)**.

The short version:

| | |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist/` |
| Upload to | `public_html/` |
| Node required | at build time only — the site itself is pure static files |
