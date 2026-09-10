/**
 * Full-page screenshots with real device-metric emulation, via CDP.
 *
 *   node _work/shot.mjs <outDir> [baseUrl]
 *
 * Uses Node's built-in WebSocket — no puppeteer dependency.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.argv[2] ?? '_work/shots';
const BASE = process.argv[3] ?? 'http://localhost:4321';
const PORT = 9333;

const PAGES = [
  ['home', '/'],
  ['catalogo', '/catalogo/'],
  ['detalle', '/catalogo/ojo-de-bife/'],
  ['nosotros', '/nosotros/'],
  ['contacto', '/contacto/'],
  ['404', '/404/'],
];

const WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440];

await mkdir(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--user-data-dir=/tmp/cortes-cdp-profile',
  'about:blank',
]);
chrome.stderr.on('data', () => {});

async function targetUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not expose a debug target');
}

const ws = new WebSocket(await targetUrl());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

await send('Page.enable');
await send('Runtime.enable');

const report = [];

for (const width of WIDTHS) {
  const mobile = width < 768;
  for (const [name, path] of PAGES) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: 900,
    });
    await send('Page.navigate', { url: BASE + path });
    await sleep(900);

    // Force any pending reveal animations so nothing is captured mid-fade.
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-visible'));
        document.documentElement.style.scrollBehavior='auto';`,
    });
    await sleep(350);

    const metrics = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        vw: document.documentElement.clientWidth,
        scrollW: document.documentElement.scrollWidth,
        h: document.documentElement.scrollHeight,
        overflow: (() => {
          const vw = document.documentElement.clientWidth; const bad = [];
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
              bad.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
            }
          });
          return [...new Set(bad)].slice(0, 8);
        })(),
        tinyTargets: (() => {
          const bad = [];
          document.querySelectorAll('a,button,input,select').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 24)) {
              bad.push((el.textContent || el.tagName).trim().slice(0, 26) + ' [' + Math.round(r.width) + 'x' + Math.round(r.height) + ']');
            }
          });
          return [...new Set(bad)].slice(0, 8);
        })(),
      })`,
      returnByValue: true,
    });
    const m = JSON.parse(metrics.result.value);
    report.push({ width, page: name, ...m });

    const height = Math.min(m.h, 16000);
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: height,
    });
    // Full-page capture outruns lazy loading, so force every image in and wait
    // for it to decode before shooting.
    await send('Runtime.evaluate', {
      expression: `(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
        await Promise.all([...document.images].map(i => i.complete
          ? Promise.resolve()
          : new Promise(r => { i.addEventListener('load', r, {once:true}); i.addEventListener('error', r, {once:true}); setTimeout(r, 4000); })));
      })()`,
      awaitPromise: true,
    });
    await sleep(500);

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(`${OUT}/${name}-${width}.png`, Buffer.from(shot.data, 'base64'));
  }
}

await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 1));

const problems = report.filter(
  (r) => r.scrollW > r.vw + 1 || r.overflow.length || r.tinyTargets.length,
);
if (problems.length) {
  console.log('ISSUES:');
  for (const p of problems) {
    console.log(
      ` ${p.page} @${p.width}: scrollW=${p.scrollW}/${p.vw}` +
        (p.overflow.length ? ` overflow=${p.overflow.join(', ')}` : '') +
        (p.tinyTargets.length ? ` tiny=${p.tinyTargets.join(' | ')}` : ''),
    );
  }
} else {
  console.log('No overflow or undersized targets at any width.');
}

ws.close();
chrome.kill();
