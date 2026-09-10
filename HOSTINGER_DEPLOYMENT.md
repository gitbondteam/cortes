# Deploying to Hostinger

The site is **fully static**. Once built, `dist/` is a folder of HTML, CSS,
JavaScript, fonts and images — nothing else. There is no server-side code, no
database, no API routes and no persistent Node process. It runs on any static
host; these notes cover Hostinger Business specifically.

---

## Summary

| Setting | Value |
| --- | --- |
| Install command | `npm install` |
| Build command | `npm run build` |
| **Output directory** | **`dist/`** |
| Publish target on the server | `public_html/` |
| Node.js version | **22.12 or newer** — build time only |
| Runtime requirements on the server | none |
| Environment variables | none |
| Domain | `https://cortesargentinos.com.ar` |

**What to upload:** the *contents* of `dist/`, not the folder itself.
`public_html/index.html` must exist, not `public_html/dist/index.html`.

---

## Before the first deploy

Confirm the production domain in **`src/data/site.ts`**:

```ts
domain: 'https://cortesargentinos.com.ar',
```

This value generates canonical URLs, OpenGraph URLs, JSON-LD and the sitemap. If
the site launches on a different hostname (a staging subdomain, say), change it
here and rebuild — otherwise the sitemap and canonicals will point at the wrong
host.

---

## Option A — GitHub auto-deploy (recommended)

Hostinger's Git integration **clones a repository and serves it. It does not run
a build.** So the built output has to be in the repository.

Two ways to arrange that:

### A1. Commit `dist/` to a deploy branch

Keep `main` clean and push builds to a separate branch.

1. Remove `dist` from `.gitignore` **on the deploy branch only**, or use a
   worktree:

   ```bash
   npm run build
   git checkout -B deploy
   git add -f dist
   git commit -m "Build $(date +%F)"
   git push -u origin deploy
   ```

2. In hPanel → **Website → Git**:
   - Repository: your GitHub URL
   - Branch: `deploy`
   - Directory: `public_html`
3. Click **Deploy**, then **Auto-deployment** to enable the webhook.

Because the repo root then contains `dist/`, set the site's document root to
`public_html/dist` (hPanel → **Advanced → Website settings → Document root**),
or use A2 instead, which avoids the nesting.

### A2. Build in GitHub Actions, publish only the output — **this is what is set up**

`main` never contains build artefacts. A workflow builds the site and
force-pushes the *contents* of `dist/` to a `deploy` branch, which is what
Hostinger clones into `public_html`.

The workflow is already in the repo at **`.github/workflows/deploy.yml`**. It:

1. checks out `main`, installs with `npm ci` on Node 22;
2. runs `npm run build` — which type-checks and validates the catalogue first;
3. sanity-checks the output (index, 404, `.htaccess`, robots, sitemap, and that
   exactly 33 product routes exist) and **fails the deploy** if anything is off;
4. force-pushes `dist/`'s contents to `deploy` using only the built-in
   `GITHUB_TOKEN` — no third-party actions, no secrets to manage.

Then point Hostinger's Git integration at branch **`deploy`**, directory
**`public_html`**. Every push to `main` rebuilds and redeploys, and the document
root stays at the default `public_html`.

> **`deploy` is machine-owned.** It is rewritten from scratch on every run —
> never commit to it by hand, anything pushed there will be discarded. All real
> work happens on `main`.

> `npm ci` requires `package-lock.json` to be committed. It is.

To publish without changing anything, re-run the workflow by hand:

```bash
gh workflow run "Build and publish" --ref main
gh run watch
```

---

## Option B — Manual upload

Fine for occasional updates.

```bash
npm install
npm run build
```

Then in hPanel → **File Manager**:

1. Open `public_html/`.
2. Delete the old contents (keep any `.well-known/` directory if present).
3. Upload everything **inside** `dist/` — including the hidden `.htaccess`.
4. Confirm `public_html/index.html` exists.

Or over SFTP, from the project root:

```bash
# note the trailing slash on dist/ — it copies the contents, not the folder
rsync -avz --delete dist/ user@your-host:/home/user/domains/cortesargentinos.com.ar/public_html/
```

`--delete` removes files that no longer exist in the build. Take a backup the
first time you use it.

### Watch out for `.htaccess`

The site ships `public/.htaccess`, which Astro copies to `dist/.htaccess`. It is
a **hidden file** — File Manager and some FTP clients skip hidden files by
default. If the custom 404 page or HTTPS redirect doesn't work after a deploy,
this is almost always why. Enable "show hidden files" and upload it.

---

## Domain configuration

Assumptions, to confirm in hPanel:

- `cortesargentinos.com.ar` is added to the account and its document root is
  `public_html`.
- SSL is issued (hPanel → **Security → SSL**). Hostinger provisions Let's
  Encrypt automatically; wait for it to report *Active* before enabling the
  HTTPS redirect below.
- `www.cortesargentinos.com.ar` resolves to the same host.

**No DNS changes are made by this project.** If the domain is registered
elsewhere, point its nameservers or A record at Hostinger first, and wait for
propagation.

### The HTTPS and www redirects

`.htaccess` forces HTTPS and strips `www.`, so one canonical host serves the
site — matching the canonical URLs in the HTML.

Both rules are active as shipped. **If SSL is not yet issued, the HTTPS redirect
will cause a redirect loop or a certificate warning.** Either wait for SSL to go
active before deploying, or comment out the `RewriteCond %{HTTPS}` block in
`public/.htaccess` for the first deploy and restore it afterwards.

---

## What `.htaccess` does

| Block | Effect |
| --- | --- |
| `ErrorDocument 404 /404.html` | Serves the branded 404 page |
| HTTPS + non-www rewrites | One canonical origin |
| Directory rewrite | `/catalogo/lomo/` resolves to its `index.html` |
| `mod_deflate` | Compresses HTML, CSS, JS, SVG |
| `mod_expires` / `mod_headers` | Long cache for images, fonts and hashed assets; HTML always revalidates |
| MIME types | Declares WebP and WOFF2 on older Apache builds |
| Security headers | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` |

Every block is wrapped in `<IfModule>`, so a server without a given module
simply ignores it rather than erroring.

**HTML is set to `max-age=0, must-revalidate` deliberately.** Pages are tiny and
this guarantees a redeploy is visible immediately. Images, fonts and the
content-hashed files in `/_astro/` are cached long-term, so repeat visits are
still fast.

---

## URL shape

Astro is configured with `trailingSlash: 'always'` and `format: 'directory'`, so
every route is a real directory containing `index.html`:

```
dist/index.html                       →  /
dist/catalogo/index.html              →  /catalogo/
dist/catalogo/ojo-de-bife/index.html  →  /catalogo/ojo-de-bife/
dist/404.html                         →  served by ErrorDocument
```

This is the friendliest shape for Apache/LiteSpeed: no rewrite rules are
strictly required for pages to resolve. Keep it — switching to
`trailingSlash: 'never'` would change every URL and need redirects.

---

## Post-deploy checklist

- [ ] `https://cortesargentinos.com.ar/` loads over HTTPS with a valid certificate
- [ ] `http://` and `www.` both redirect to the canonical `https://` host
- [ ] `/catalogo/` lists 33 products; the category chips and search work
- [ ] A product page loads, e.g. `/catalogo/ojo-de-bife/`
- [ ] `/una-url-inventada/` shows the branded 404, not the Hostinger default
- [ ] `/robots.txt` and `/sitemap-index.xml` return the live domain
- [ ] No prices are visible anywhere (expected — see README)
- [ ] The WhatsApp button opens a chat with **+54 9 3525 414150**
- [ ] The logo, fonts and product photos all load (check the Network tab for 404s)
- [ ] The site is usable on a phone
- [ ] Submit the sitemap in Google Search Console

---

## Troubleshooting

**Blank page, or CSS and images 404.**
The contents of `dist/` were not uploaded to the document root — you probably
uploaded the `dist` folder itself. `public_html/index.html` must exist.

**404 page is Hostinger's, not ours.**
`.htaccess` didn't upload (hidden file), or `mod_rewrite` is off. Re-upload it
with hidden files shown.

**Redirect loop.**
SSL is not yet active while the HTTPS redirect is. Wait for the certificate, or
temporarily comment out that block in `.htaccess`.

**Old content after deploying.**
Purge the Hostinger cache in hPanel, and hard-reload. Cached `/_astro/` files
are content-hashed, so a real rebuild always produces new filenames — stale HTML
is the usual culprit, and the `must-revalidate` header prevents it going
forward.

**`npm run build` fails on the CI runner.**
Check the Node version is 22.12+. The build also validates the catalogue, so a
duplicate slug or a missing image path will stop it on purpose — read the error,
it names the product.
