/**
 * Accessibility / SEO audit over the built pages, via CDP.
 *   node _work/audit.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.argv[2] ?? 'http://localhost:4321';
const PORT = 9334;

const PAGES = [
  '/',
  '/catalogo/',
  '/catalogo/ojo-de-bife/',
  '/catalogo/vacio/',
  '/nosotros/',
  '/contacto/',
  '/404/',
];

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--user-data-dir=/tmp/cortes-audit-profile',
  'about:blank',
]);
chrome.stderr.on('data', () => {});

async function targetUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = list.find((t) => t.type === 'page');
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('no target');
}

const ws = new WebSocket(await targetUrl());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');

const AUDIT = `(() => {
  const out = { issues: [] };
  const add = (m) => out.issues.push(m);

  // --- Document / SEO ---
  out.title = document.title;
  out.lang = document.documentElement.lang;
  out.desc = document.querySelector('meta[name=description]')?.content ?? null;
  out.canonical = document.querySelector('link[rel=canonical]')?.href ?? null;
  out.og = !!document.querySelector('meta[property="og:image"]');
  out.jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].length;
  if (!out.lang) add('missing lang');
  if (!out.desc) add('missing meta description');
  if (!out.canonical) add('missing canonical');
  if (!out.title || out.title.length > 65) add('title length ' + (out.title||'').length);
  if (out.desc && (out.desc.length < 60 || out.desc.length > 175)) add('description length ' + out.desc.length);

  // --- Landmarks ---
  out.landmarks = {
    header: document.querySelectorAll('body > header').length,
    main: document.querySelectorAll('main').length,
    footer: document.querySelectorAll('body > footer').length,
    nav: document.querySelectorAll('nav').length,
  };
  if (out.landmarks.main !== 1) add('main count ' + out.landmarks.main);
  [...document.querySelectorAll('nav')].forEach((n, i) => {
    if (!n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')) add('nav #'+i+' unlabelled');
  });

  // --- Headings ---
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  out.h1Count = hs.filter(h => h.tagName === 'H1').length;
  if (out.h1Count !== 1) add('h1 count ' + out.h1Count);
  let prev = 0;
  hs.forEach(h => {
    const lvl = +h.tagName[1];
    if (prev && lvl > prev + 1) add('heading jump h'+prev+' -> h'+lvl+' ("'+h.textContent.trim().slice(0,30)+'")');
    prev = lvl;
  });
  out.headings = hs.map(h => h.tagName + ':' + h.textContent.trim().slice(0, 28));

  // --- Images ---
  [...document.images].forEach(img => {
    if (img.getAttribute('alt') === null) add('img without alt: ' + img.currentSrc.split('/').pop());
    if (!img.getAttribute('width') || !img.getAttribute('height')) {
      add('img without dimensions: ' + (img.getAttribute('src')||'').split('/').pop());
    }
  });

  // --- Links & buttons need an accessible name ---
  [...document.querySelectorAll('a,button')].forEach(el => {
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
    if (!name) add('control without accessible name: ' + el.outerHTML.slice(0, 70));
    if (el.tagName === 'A' && !el.getAttribute('href')) add('anchor without href');
    if (el.target === '_blank' && !(el.rel||'').includes('noopener')) add('target=_blank without noopener');
  });

  // --- Contrast (text vs its painted backdrop) ---
  const lum = (c) => {
    const s = c.map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
  };
  const parse = (str) => { const m = str.match(/[\\d.]+/g); return m ? m.slice(0,3).map(Number) : null; };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = getComputedStyle(n).backgroundColor;
      const p = parse(c);
      if (p && !/rgba\\(.*,\\s*0\\)/.test(c)) return p;
      n = n.parentElement;
    }
    return [27,27,27];
  };
  const seen = new Set();
  [...document.querySelectorAll('p,a,span,li,h1,h2,h3,h4,dt,dd,button,address,label')].forEach(el => {
    if (!el.textContent.trim()) return;
    if (el.querySelector('p,a,span,li,h1,h2,h3,h4,dt,dd,button,address')) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const fg = parse(cs.color); if (!fg) return;
    const bg = bgOf(el);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    const px = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const min = large ? 3 : 4.5;
    if (ratio < min) {
      const key = cs.color + '|' + bg.join(',') + '|' + Math.round(px);
      if (!seen.has(key)) {
        seen.add(key);
        add('contrast ' + ratio.toFixed(2) + ' (min ' + min + ') ' + cs.color + ' on rgb(' + bg.join(',') + ') @' + px + 'px — "' + el.textContent.trim().slice(0,32) + '"');
      }
    }
  });
  return JSON.stringify(out);
})()`;

let total = 0;
for (const path of PAGES) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await send('Page.navigate', { url: BASE + path });
  await sleep(1100);
  await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-visible'));
      document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');`,
  });
  await sleep(600);
  const res = await send('Runtime.evaluate', { expression: AUDIT, returnByValue: true });
  const a = JSON.parse(res.result.value);
  total += a.issues.length;
  console.log(`\n── ${path}`);
  console.log(`   title: ${a.title}`);
  console.log(`   h1:${a.h1Count} jsonld:${a.jsonld} lang:${a.lang} og:${a.og}`);
  console.log(`   landmarks: ${JSON.stringify(a.landmarks)}`);
  if (a.issues.length) a.issues.forEach((i) => console.log('   ⚠ ' + i));
  else console.log('   ✓ no issues');
}
console.log(`\nTOTAL ISSUES: ${total}`);
ws.close();
chrome.kill();
