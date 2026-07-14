// Crawls the live site to discover real outbound links between pages,
// courses, and events (lessons are skipped — their curriculum is only
// visible when logged in, so an anonymous crawl can't see it). Matches
// discovered hrefs against the known inventory by URL pathname (the site is
// mirrored across two domains, so we ignore domain and match on path only).
//
// Runs slowly and sequentially on purpose — the host (SiteGround) rate-limits
// bursts of requests with an sgcaptcha challenge. If that challenge is
// detected, the crawl stops immediately rather than hammering a blocked IP
// further. Safe to re-run: it resumes from crawl-state.json and only
// (re)fetches URLs that don't already have a result, then republishes the
// compact public/data/links.json the app actually loads.
const fs = require('fs');
const path = require('path');

const sitemap = require('../src/data/sitemap.json');
const STATE_PATH = path.join(__dirname, 'crawl-state.json'); // full diagnostic state, not shipped
const PUBLISHED_PATH = path.join(__dirname, '..', 'public', 'data', 'links.json'); // compact, shipped to the app

const REQUEST_DELAY_MS = 900;
const TIMEOUT_MS = 15000;
const MAX_CONSECUTIVE_BLOCKS = 3;
const SKIP_CATEGORIES = new Set(['portal', 'utility']);
const SKIP_SLUGS = new Set([
  'test', 'mixpanel-testing', 'wp-2fa-config', 'html', 'media-attachments',
  'acf-flexible-sections', 'flexible-blocks', 'husky-template-new',
]);
const IGNORE_HREF_PATTERNS = [
  /^#/, /^mailto:/, /^tel:/, /wp-json/, /wp-content/, /wp-includes/,
  /\/feed\/?$/, /xmlrpc\.php/, /\?ical=1/, /\/wp-admin/, /\.(css|js|png|jpe?g|svg|webp|woff2?|ico|pdf)(\?|$)/,
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePath(url) {
  try {
    const u = new URL(url, 'https://pahp.underdogdigitalwebsite.com');
    let p = u.pathname.toLowerCase();
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p || '/';
  } catch {
    return null;
  }
}

function buildInventory() {
  const items = [...sitemap.pages, ...sitemap.courses, ...sitemap.events];
  const byPath = new Map();
  const byId = new Map();
  items.forEach((item) => {
    const p = normalizePath(item.url);
    if (p && !byPath.has(p)) byPath.set(p, item);
    byId.set(item.id, item);
  });
  return { items, byPath, byId };
}

function getCrawlList(items) {
  return items.filter((item) => {
    if (item.type === 'page') {
      if (SKIP_CATEGORIES.has(item.category)) return false;
      if (SKIP_SLUGS.has(item.slug)) return false;
      return true;
    }
    return item.type === 'course' || item.type === 'event';
  });
}

function loadState() {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    if (!data.attempted) data.attempted = {};
    if (!data.outbound) data.outbound = {};
    return data;
  } catch {
    return { outbound: {}, attempted: {} };
  }
}

// Fetch result is one of: { ok: true, html } | { ok: false, blocked: true } | { ok: false, blocked: false }
async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    const text = await res.text();
    if (res.status === 202 && text.includes('sgcaptcha')) return { ok: false, blocked: true };
    if (!res.ok) return { ok: false, blocked: false };
    return { ok: true, html: text };
  } catch {
    return { ok: false, blocked: false };
  } finally {
    clearTimeout(timer);
  }
}

function extractLinks(html, baseUrl) {
  const hrefs = new Set();
  const re = /href="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (IGNORE_HREF_PATTERNS.some((re2) => re2.test(href))) continue;
    try {
      hrefs.add(new URL(href, baseUrl).toString());
    } catch {
      // ignore malformed hrefs
    }
  }
  return [...hrefs];
}

// Some targets (Home, Login, Terms of Service, footer/legal links...) show up
// in nearly every page's nav/footer chrome. That's real, but it's not a
// "journey" — it drowns out the specific links (a resource guide's related
// guides, a course's cross-sell) that are the actual point of this feature.
// Anything linked from almost every crawled source gets flagged as site-wide
// chrome so the app can show it separately/collapsed instead of mixed in.
const COMMON_NAV_THRESHOLD = 0.9;

function computeCommonNav(outbound) {
  const totalSources = Object.keys(outbound).length;
  const freq = {};
  Object.values(outbound).forEach((targetIds) => {
    targetIds.forEach((id) => { freq[id] = (freq[id] || 0) + 1; });
  });
  return Object.entries(freq)
    .filter(([, count]) => count / totalSources >= COMMON_NAV_THRESHOLD)
    .map(([id]) => id);
}

function publishCompact(outbound, byId) {
  const inbound = {};
  Object.entries(outbound).forEach(([sourceId, targetIds]) => {
    targetIds.forEach((targetId) => {
      if (!inbound[targetId]) inbound[targetId] = [];
      inbound[targetId].push(sourceId);
    });
  });
  const commonNav = computeCommonNav(outbound);
  const published = { crawledAt: new Date().toISOString(), outbound, inbound, commonNav };
  fs.mkdirSync(path.dirname(PUBLISHED_PATH), { recursive: true });
  fs.writeFileSync(PUBLISHED_PATH, JSON.stringify(published));
  return published;
}

async function main() {
  const { items, byPath, byId } = buildInventory();
  const crawlList = getCrawlList(items);
  const state = loadState();
  const outbound = { ...state.outbound }; // id -> [targetId, ...]
  const attempted = { ...state.attempted }; // id -> true | 'no-links' | 'failed'

  const todo = crawlList.filter((item) => attempted[item.id] !== true && attempted[item.id] !== 'no-links');
  console.log(`${crawlList.length} URLs in scope, ${todo.length} still need (re)crawling...`);

  let consecutiveBlocks = 0;
  let stoppedEarly = false;
  let i = 0;

  for (const item of todo) {
    i += 1;
    const result = await fetchHtml(item.url);

    if (!result.ok) {
      if (result.blocked) {
        consecutiveBlocks += 1;
        console.log(`\n  BLOCKED (sgcaptcha) on ${item.url} (${consecutiveBlocks}/${MAX_CONSECUTIVE_BLOCKS})`);
        if (consecutiveBlocks >= MAX_CONSECUTIVE_BLOCKS) {
          console.log('  Too many consecutive blocks — stopping early to avoid making it worse.');
          stoppedEarly = true;
          break;
        }
      } else {
        attempted[item.id] = 'failed';
      }
    } else {
      consecutiveBlocks = 0;
      const hrefs = extractLinks(result.html, item.url);
      const targetIds = new Set();
      hrefs.forEach((href) => {
        const p = normalizePath(href);
        if (!p) return;
        const target = byPath.get(p);
        if (!target || target.id === item.id) return;
        targetIds.add(target.id);
      });
      if (targetIds.size > 0) {
        outbound[item.id] = [...targetIds];
        attempted[item.id] = true;
      } else {
        delete outbound[item.id];
        attempted[item.id] = 'no-links';
      }
    }

    if (i % 20 === 0 || i === todo.length) {
      process.stdout.write(`\r  ${i}/${todo.length} attempted this run`);
    }
    await sleep(REQUEST_DELAY_MS);
  }
  console.log('');

  const failedIds = Object.entries(attempted).filter(([, v]) => v === 'failed').map(([id]) => id);
  const state_out = {
    lastRunAt: new Date().toISOString(),
    stoppedEarlyDueToBlocking: stoppedEarly,
    totalInScope: crawlList.length,
    succeededOrEmpty: Object.values(attempted).filter((v) => v === true || v === 'no-links').length,
    failedCount: failedIds.length,
    failedUrls: failedIds.map((id) => byId.get(id)?.url).filter(Boolean),
    attempted,
    outbound,
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(state_out, null, 2));
  publishCompact(outbound, byId);

  console.log(`Sources with outbound links: ${Object.keys(outbound).length}`);
  console.log(`Still unresolved (failed or blocked before reaching): ${crawlList.length - state_out.succeededOrEmpty}`);
  if (stoppedEarly) console.log('Run "npm run crawl:links" again later — it will resume where this left off.');
  console.log(`Published ${PUBLISHED_PATH}`);
}

main();
