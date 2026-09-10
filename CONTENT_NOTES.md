# Content notes

Everything published on this site comes from the two supplied PDFs:

| Source | Used for |
| --- | --- |
| `Brochure Cortes Argentinos.pdf` (8 pages) | Brand identity, palette, logo, institutional copy, editorial photography |
| `Catálogo de Cortes Argentinos - Precios.pdf` (5 pages) | The 33 products: names, presentations, prices, product photography |

Both originals are kept in `_source/` for reference. They are **not** copied into
`dist/`, so they are never published.

This file records every place where the site departs from a literal reading of
those PDFs, plus the assumptions and the deliberate omissions.

---

## 1. Copy that was corrected

The brochure has a handful of typographic and OCR artefacts. Meaning was
preserved in every case; only spelling, punctuation and agreement were fixed.

| Source text | Published as | Why |
| --- | --- | --- |
| "Somos una cadena de carnicerías donde nuestro foco **es** los diferentes cortes" | "…donde nuestro foco **son** los diferentes cortes" | Subject–verb agreement. |
| "**Tú** corte de carne y como se hace" | "**Tu** corte de carne y cómo se hace" | Possessive `tu`, not the pronoun `tú`; missing accent on the interrogative `cómo`. |
| "como prepararlo… como degustarlo" | "cómo prepararlo… cómo degustarlo" | Missing accents on interrogatives. |
| "para que el cocinar en fuego sea una experiencia única" | "para que cocinar al fuego sea una experiencia única" | Reads as intended in Argentine Spanish. |
| "Nuestras carnicerías están preparadas con una experiencia tecnología especial" | *not published* | The sentence is garbled in the source; see §5. |
| "un producto Premium 100% argentino" | "un producto premium 100 % argentino" | Lower-case adjective, non-breaking-style spacing before `%`. |
| "Publicidad Corporativa." | "Publicidad corporativa." | Sentence case, consistent with the rest of the list. |
| "EN BASE APERFIL Y CAPACIDAD" | "en base a perfil y capacidad" | Missing word space. |
| "BASICOS" | "básicos" | Missing accent. |

### Product names

| Catalogue | Published | Why |
| --- | --- | --- |
| `VACIO` | `Vacío` | Missing accent. |
| `MORCILLA x2un.` | name `Morcilla`, presentation `x 2 un.` | The quantity is a presentation, not part of the name. |
| `CHORIZO` + `x4un.` | name `Chorizo`, presentation `x 4 un.` | Same. |

All other names are transcribed exactly, including `Corte del Rey`,
`Flat Iron`, `T-Bone`, `Tomahawk` and `Corte Americano`.

### Presentations

Normalised for the web while preserving meaning:

- `175g aprox.` → `175 g aprox.` (space between number and unit throughout)
- `(500grs)` → `500 g`
- `(500grs / 1kg / 2 kg)` → `500 g / 1 kg / 2 kg`
- `(1.250kg aprox.)` and `(1,250kg aprox.)` → **`1,250 kg aprox.`** — the source
  is inconsistent between the two products (`Costilla` uses a comma,
  `Costilla Ventana` a period). Argentine convention uses the comma as the
  decimal separator, so both were normalised to the comma form.
- `(1.5kg aprox.)` → `1,5 kg aprox.` (same reason, `Lomo`)
- `BIFE DE CHORIZO 500g aprox. (Pack de 2 o 3 bifes anchos)` →
  `500 g aprox. · Pack de 2 o 3 bifes anchos`
- `BIFE DE PICAÑA 500g aprox aprox. (Pack de 3 o 4 bifes)` →
  `500 g aprox. · Pack de 3 o 4 bifes` — the source repeats "aprox"; the
  duplicate was dropped.

Nine products carry **no** presentation in the catalogue and therefore none on
the site: Corte del Rey, Flat Iron, Osobuco, Ponchito de Cerdo, Punta de
Espalda, Tapa de Asado, T-Bone, Tomahawk and Vacío.

### URL slugs

Slugs are ASCII (`/catalogo/entrana/`, `/catalogo/vacio/`, `/catalogo/picana/`)
rather than accented, so the URLs stay portable across static hosts, mail
clients and analytics. The accented name is always shown in the page itself.

---

## 2. Prices

All 33 prices are transcribed into `src/data/products.ts` exactly as printed
(per kilo, ARS) so they are available when needed.

**They are hidden by default.** `site.catalog.showPrices` is `false`, which
means:

- no price is rendered anywhere in the markup (not hidden with CSS — simply not
  emitted);
- product JSON-LD omits the `Offer` node entirely, because publishing offer data
  for a catalogue with no visible price would be misleading;
- the layout is identical either way, so enabling prices never shifts anything.

The prices in the PDF are undated. Argentine prices move quickly, so treat them
as a historical snapshot and re-check before switching the flag on.

---

## 3. Categories

The catalogue is not organised into categories in the source, so a minimal,
factual taxonomy was derived from the products themselves:

| Category | Count | Members |
| --- | --- | --- |
| Vacunos | 28 | everything not listed below |
| Cerdo | 2 | Matambre de Cerdo, Ponchito de Cerdo |
| Embutidos y elaborados | 3 | Chorizo, Morcilla, Salame |

Assignments follow the product names only. No culinary classification
(tenderness, cooking method, primal cut, grade) was invented, because the source
supports none.

`Bife de Peceto` and `Peceto` are kept as **separate** products, as they are in
the catalogue. The same applies to `Picaña` / `Bife de Picaña` and
`Costilla` / `Costilla Banderita` / `Costilla Ventana`.

An optional `tags` array exists on the product model for future growth; today it
only marks the four products sold in packs or units.

---

## 4. Product descriptions

**None were written.** The catalogue provides no descriptive copy, and inventing
marketing text for 33 cuts would be fabrication. Product pages therefore show
name, category, presentation, packaging and a WhatsApp enquiry — a clean, honest
page rather than filler.

The `description` field exists on the product model and renders automatically if
real copy is added later.

---

## 5. Deliberately not published

These claims appear in the brochure but were left out of the launch site because
they describe operational capabilities that may no longer be current. They are
recorded here so the decision can be revisited with the client.

| Claim | Where | Why omitted |
| --- | --- | --- |
| "¡Una APP exclusiva te espera para ser descargada!" | Brochure p.5 | No app is linked anywhere and none could be verified. Advertising a download with no destination would be a dead end for the visitor. |
| Home delivery ("pedir desde tu casa por delivery") | Brochure p.5 | Time-sensitive operational claim; no coverage area, hours or ordering channel given. |
| "promociones diarias increíbles" / "App de descuentos" | Brochure p.5–6 | Promotional claim with no current offer to point to. |
| QR product scanning in store ("escanear el QR del producto") | Brochure p.5 | Describes in-store hardware that cannot be verified; the sentence is also garbled in the source ("una experiencia tecnología especial"). |
| "Software de gestión", "Auditorías y mejora continua" | Brochure p.6 | Franchise-facing, not customer-facing — kept in the franchise data instead. |

The *experience* content that survives on `/nosotros/` ("tu corte y cómo se
hace", "cómo prepararlo", "con qué acompañarlo") is drawn from brochure p.4,
which describes what a customer finds **in the shop** — not a website feature —
so it is presented as such and claims nothing about this site.

### Franchise content

The brochure's franchise material (11 benefits, an 11-step process) is fully
transcribed in `src/data/franchise.ts` and a complete `/franquicias/` page is
built in `src/pages/franquicias/[...slug].astro`.

It is **not published**: `site.features.franchises` is `false`, so the route
emits no file and never appears in navigation. Flip the flag to publish it — see
the README. The primary goal of this site is the product catalogue, and the
franchise pitch targets a different audience entirely.

---

## 6. Facts that were *not* invented

The following were deliberately left absent because the source material does not
provide them:

- **Facebook URL.** The PDFs say only "Facebook: Cortes Argentinos" — a page
  name, not an address. `site.social.facebookUrl` is `null` and the Facebook
  icon simply does not render. Set the real URL in `src/data/site.ts` to switch
  the link on everywhere at once.
- **Opening hours** — not stated anywhere; omitted from the page and from the
  `LocalBusiness` JSON-LD.
- **Latitude / longitude and postal code** — not stated. The contact page links
  to a Google Maps *search* for the full address instead of an embedded map, and
  the JSON-LD carries no `geo` node. No mapping API key is used.
- **Email address** — none given in either PDF.
- **Years in business, number of branches, awards, certifications, cattle
  breeds, sourcing or sustainability claims, shipping coverage, price range,
  ratings** — none of these appear in the source and none are asserted.

Only one branch is named in the brochure (Jesús María, Salta 633), so the site
speaks about "la carnicería" in the singular where it refers to the shop, while
keeping the brochure's own description of the brand as "una cadena de
carnicerías".

---

## 7. Assets extracted from the PDFs

| Asset | How | Quality |
| --- | --- | --- |
| **Logo** (`public/brand/logo-*.svg`) | The brochure cover draws the lockup as **vector paths**. All 35 paths were extracted and rebuilt into a standalone SVG. | Perfect — true vector, infinitely scalable, three colour variants (light / red / dark). |
| **Product photography** (33 × `public/products/*.webp`) | Extracted as embedded images with their alpha masks intact, then trimmed to the subject, squared and re-encoded as WebP. | Good, but **limited by the source**: the PDF embeds them at 146–256 px. See the caveat below. |
| **Editorial photography** (5 × `public/images/*.webp`) | Extracted as embedded JPEGs at full resolution (up to 1920 px wide) and re-encoded. | Excellent. |
| **Charcoal texture** (`public/images/texture.webp`) | A crop of the real concrete background, high-pass filtered, edge-blended into a seamless 448 px tile and baked as black-with-alpha grain. | Excellent — 39 KB, tiles invisibly, works over any charcoal. |
| **OpenGraph card** (`public/images/og.jpg`) | Composed from the extracted texture + the vector logo. | Good. |
| **Favicons** (`public/favicon/*`) | Rendered from the vector logo. | Good. |

### Caveats

**Product image resolution.** The catalogue PDF embeds each product photo at
146–256 px on its longest edge — that is genuinely all the source contains.
They are upscaled to a uniform 420 × 420 canvas so cards never shift, and the
layout deliberately renders them at roughly 180–220 CSS px so they stay crisp on
standard displays. On a high-density screen they are slightly soft. Replacing
them with the original photography (see "How to replace product images" in the
README) is the single highest-impact asset improvement available, and needs no
code change.

**Two products have no alpha channel.** `Bife de Nalga` and `Bife de Picaña`
are embedded as flat JPEGs rather than transparent PNGs. Their white studio
background was removed with a border flood-fill. Both sit on white tiles, so the
result is visually identical to the rest.

**The brush edge is a reconstruction.** The brochure's torn brush transition is
baked into a clipping path made of ~64 overlapping stroke shapes — extracting it
would have produced a multi-megabyte SVG. `public/brand/brush-edge.svg` is a
6 KB hand-generated edge in the same visual language (irregular amplitude, dry
-brush hairs, spatter), used as a CSS mask. It is the one brand element on the
site that is an interpretation rather than a direct extraction.

**Fonts are open-source stand-ins for two faces.** The PDFs embed **Cairo**
(body) and **Open Sans Condensed** (product names), both freely available —
Cairo is used as-is. The brochure's display face is *Deadhead Rough*, a
commercial font; **Playfair Display** (900) stands in for it, matching its
high-contrast editorial character. **Oswald** carries the condensed uppercase
labels, echoing the logo. The brochure's script accent (*Nofela Script*, also
commercial) was not substituted — "nuestra pasión" is set in cream display type
instead, mirroring the two-tone treatment on brochure p.3.

---

## 8. Photograph descriptions

Alt text describes what is actually visible in each photograph, verified by
inspection, rather than repeating brand copy. Note in particular that
`public/images/local.webp` shows **a butcher portioning a cut with a cleaver** —
not a shop interior, as its filename might suggest.
