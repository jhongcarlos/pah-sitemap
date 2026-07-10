// Parses the raw CSV export + XLSX planning sheet from the client into a single
// categorized JSON file consumed by the React app. Run with `npm run build:data`.
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const ROOT = path.resolve(__dirname, '..', '..');
const CSV_PATH = path.join(ROOT, 'Pages PAH - Sheet1.csv');
const XLSX_PATH = path.join(ROOT, 'PAH Page Groups and Timelines.xlsx');
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'sitemap.json');

function slugFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || u.hostname;
  } catch {
    return url;
  }
}

function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// --- Load raw CSV (Pages / Courses / Lessons / Events) ---------------------
function loadCsv() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const pages = new Set();
  const courses = new Set();
  const lessons = new Set();
  const events = new Set();
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts[0] && parts[0].trim()) pages.add(parts[0].trim());
    if (parts[1] && parts[1].trim()) courses.add(parts[1].trim());
    if (parts[2] && parts[2].trim()) lessons.add(parts[2].trim());
    if (parts[3] && parts[3].trim()) events.add(parts[3].trim());
  }
  return {
    pages: [...pages].sort(),
    courses: [...courses].sort(),
    lessons: [...lessons].sort(),
    events: [...events].sort(),
  };
}

// --- Load the client's XLSX planning workbook -------------------------------
function loadWorkbook() {
  const wb = xlsx.readFile(XLSX_PATH);
  const sheets = {};
  wb.SheetNames.forEach((name) => {
    const ws = wb.Sheets[name];
    let data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
    while (data.length && data[data.length - 1].every((c) => c === null)) data.pop();
    sheets[name] = data;
  });
  return sheets;
}

// Rules used to flag legacy / duplicate / test pages as removal candidates.
// These are *suggestions* — nothing is deleted, the app just pre-checks the box
// and the client confirms/unchecks per item.
const REMOVAL_PATTERNS = [
  { re: /-old(-\d+)?\/?$/i, reason: 'Superseded "-old" version of a page that has a current replacement' },
  { re: /-draft\/?$/i, reason: 'Draft page, never finalized' },
  { re: /^test\/?$/i, reason: 'Internal test page' },
  { re: /mixpanel-testing/i, reason: 'Analytics test page' },
  { re: /wp-2fa-config/i, reason: 'WordPress admin/config utility, not a real page' },
  { re: /^html\/?$/i, reason: 'Raw HTML sandbox/test page' },
  { re: /media-attachments/i, reason: 'WordPress media system page, not a real page' },
  { re: /acf-flexible-sections/i, reason: 'Builder/dev test page (Advanced Custom Fields)' },
  { re: /flexible-blocks/i, reason: 'Builder/dev test page' },
  { re: /-o2?\/?$/i, reason: 'Duplicate "-o" / "-o2" variant of an existing resource guide' },
  { re: /-2\/?$/i, reason: 'Duplicate numbered variant of an existing page' },
  { re: /husky-template-new/i, reason: 'Internal template, not a published page' },
  { re: /^school-2\/?$/i, reason: 'Duplicate of /school/' },
  { re: /^peo\/?$/i, reason: 'Unlabeled/unclear placeholder page' },
  { re: /^eap\/?$/i, reason: 'Unlabeled/unclear placeholder page' },
  { re: /group-registration-(mites|mtlpa|k12promo)/i, reason: 'One-off / expired group registration promo link' },
];

function checkRemoval(url) {
  for (const rule of REMOVAL_PATTERNS) {
    if (rule.re.test(url)) return rule.reason;
  }
  return null;
}

// --- Page categorization -----------------------------------------------------
// Buckets mirror the "Navigation 2.0" plan: Main Nav, Portal, Resource Guides,
// Handouts, Registration/Utility, and everything else (Legacy Review).
const CATEGORY_RULES = [
  { key: 'main-nav', label: 'Main Site (Public Marketing Pages)', test: (slug) =>
      ['', 'home-new', 'solutions', 'about-us', 'contact-us', 'concierge', 'resources', 'resource-page-main',
       'getting-started', 'faqs', 'privacy-policy', 'terms-of-service', 'catalog', 'shop', 'why-pahps',
       'why-peace-at-home', 'our-experts', 'our-advisors', 'our-managers', 'ask-a-question',
       'custom-interactive-workshops', 'discussions-with-an-expert-recorded', 'expert-blog',
       'parenting-quick-tips', 'company-calendar'].includes(slug) },
  { key: 'b2b', label: 'B2B / Institutional Landing Pages', test: (slug) =>
      /^(corporate|school|college-mental-health$|college-mental-health-resources$|np|employers|service-page|resource-b2b|resource-template)$/.test(slug) },
  { key: 'portal', label: 'Client Portals (Logged-In)', test: (slug) =>
      /portal|login|group-registration|husky|bridgewell|worklife-at-yale|casa-for-kids|omg-working-parents|teladoc|farmington|extreme-networks|emory-university|chnct|south-windsor|mit-|be-biopharma|vernon-ct|teladoc-health|omnicom-media/.test(slug) },
  { key: 'library', label: 'Open Client Libraries', test: (slug) =>
      /library|solutions-libraries|starter-library|partner-library|mpy-solution-libraries|quick-video-solutions-pack|bbbs-quick-video/.test(slug) },
  { key: 'resource-guides', label: 'Resource Guides (By Age / Topic)', test: (slug) => /^resources-|^resources$|^neurodiversity-resources$|^college-mental-health-resources/.test(slug) },
  { key: 'handouts', label: 'Handouts', test: (slug) => /^handouts/.test(slug) },
  { key: 'utility', label: 'Utility / Account / Commerce', test: (slug) =>
      /^(cart|checkout|register|profile|user-profile|client-request-form|class-registration-confirmation|private-coaching-session|private-consulting|11-consultation|11-consulting-open-library|group-users-2|welcome-baby|pah-resources|pah-our-advisors|pah-our-managers|teenlife|platform|register-free-online-parenting-class)$/.test(slug) },
];

function categorizePage(url) {
  const slug = slugFromUrl(url);
  for (const rule of CATEGORY_RULES) {
    if (rule.test(slug)) return rule.key;
  }
  return 'legacy-review';
}

// --- Course/lesson/event tagging --------------------------------------------
const CLIENT_TAGS = ['mit', 'emory', 'omnicom', 'yum-brands', 'teladoc', 'husky', 'yale', 'bbbs', 'skillsoft', 'the-hartford'];

function tagClient(url) {
  const lower = url.toLowerCase();
  const found = CLIENT_TAGS.find((c) => lower.includes(c));
  return found || null;
}

function isSpanish(url) {
  return /espanol|-es\/|husky-conceptos|husky-bienestar|husky-apoyo|husky-seguridad|husky-neurodiversidad|husky-escolar|husky-parenting-basics|husky-mental-health|husky-neurodiversity|husky-social|husky-tweens|husky-preadolescentes|edad-escolar|ninos-pequenos|estrategias-esenciales|primera-generacion|ayuda-a-tu/i.test(url);
}

function buildRecord(url, type) {
  const slug = slugFromUrl(url);
  return {
    id: `${type}:${url}`,
    type,
    url,
    slug,
    title: titleFromSlug(slug),
    client: tagClient(url),
    spanish: isSpanish(url),
  };
}

function run() {
  const csv = loadCsv();
  const sheets = loadWorkbook();

  const pages = csv.pages.map((url) => {
    const rec = buildRecord(url, 'page');
    rec.category = categorizePage(url);
    const removal = checkRemoval(url);
    rec.suggestedDelete = Boolean(removal);
    rec.suggestedReason = removal;
    return rec;
  });

  const courses = csv.courses.map((url) => buildRecord(url, 'course'));

  const lessons = csv.lessons.map((url) => {
    const rec = buildRecord(url, 'lesson');
    const m = url.match(/\/courses\/([^/]+)\/lessons\//);
    rec.parentCourseSlug = m ? m[1] : null;
    return rec;
  });

  const events = csv.events.map((url) => buildRecord(url, 'event'));

  const meta = {
    generatedAt: new Date().toISOString(),
    counts: {
      pages: pages.length,
      courses: courses.length,
      lessons: lessons.length,
      events: events.length,
      suggestedDeletions: pages.filter((p) => p.suggestedDelete).length,
    },
  };

  const navigationPlan = extractNavigationPlan(sheets['Navigation 2.0']);
  const urlMapping = extractUrlMapping(sheets['New Navigation']);
  const resourceGuides = extractResourceGuides(sheets['Resource Guides']);
  const portalPlan = extractPortalPlan(sheets['Portal']);

  const output = { meta, pages, courses, lessons, events, navigationPlan, urlMapping, resourceGuides, portalPlan };
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUT_PATH}`);
  console.log(meta.counts);
}

function extractNavigationPlan(rows) {
  if (!rows) return null;
  // Row 2 (index 2) has headers: Main Page | Sub Nav | New URL | Sub URL
  const items = [];
  let current = null;
  for (let i = 3; i < rows.length; i++) {
    const [main, sub, newUrl] = rows[i];
    if (main && String(main).trim() && !/setup|set up|remove the unwanted/i.test(main)) {
      current = { title: String(main).trim(), url: newUrl || null, children: [] };
      items.push(current);
    } else if (sub && String(sub).trim() && current) {
      current.children.push({ title: String(sub).trim() });
    }
  }
  return items;
}

function extractUrlMapping(rows) {
  if (!rows) return [];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const [title, oldUrl, newUrl, , status] = rows[i];
    if (!title || !String(title).trim()) continue;
    if (/^(button on the resource page|LD and what|Section 3)/i.test(title)) continue;
    out.push({ title: String(title).trim(), oldUrl: oldUrl || null, newUrl: newUrl || null, status: status || null });
  }
  return out;
}

function extractResourceGuides(rows) {
  if (!rows) return [];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const [title, url, , status] = rows[i];
    if (!title || !String(title).trim()) continue;
    out.push({ title: String(title).trim(), url: url || null, status: status || null });
  }
  return out;
}

function extractPortalPlan(rows) {
  if (!rows) return [];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const [, title, url, , notes, status] = rows[i];
    if (!title || !String(title).trim()) continue;
    out.push({ title: String(title).trim(), url: url || null, notes: notes || null, status: status || null });
  }
  return out;
}

run();
