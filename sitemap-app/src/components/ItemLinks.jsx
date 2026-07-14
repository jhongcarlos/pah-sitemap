import { useEffect, useState } from 'react';
import sitemapData from '../data/sitemap.json';

// The link graph is fetched once at runtime from a static asset (not bundled
// into the JS — it's several hundred KB of crawled data) and shared across
// every ItemLinks instance via this module-level cache.
let linksPromise = null;
function loadLinks() {
  if (!linksPromise) {
    linksPromise = fetch('/data/links.json')
      .then((r) => (r.ok ? r.json() : { outbound: {}, inbound: {}, commonNav: [] }))
      .catch(() => ({ outbound: {}, inbound: {}, commonNav: [] }));
  }
  return linksPromise;
}

let itemByIdCache = null;
function itemById() {
  if (!itemByIdCache) {
    itemByIdCache = new Map(
      [...sitemapData.pages, ...sitemapData.courses, ...sitemapData.events].map((i) => [i.id, i]),
    );
  }
  return itemByIdCache;
}

function resolveAndSort(ids, commonNavSet, lookup) {
  return ids
    .filter((id) => !commonNavSet.has(id))
    .map((id) => lookup.get(id))
    .filter(Boolean)
    .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
}

// Shows the real outbound/inbound links discovered by the site crawler
// (npm run crawl:links) for a given page/course/event — this is the actual
// user journey, not a guess: "this resource guide really links to these
// course videos" etc. Site-wide chrome (Home, Login, Terms, Privacy — things
// linked from nearly every page) is filtered out entirely since it's not a
// journey, just boilerplate nav/footer. Lessons aren't crawled (their
// curriculum is only visible when logged in), so items with no data simply
// render nothing.
export default function ItemLinks({ itemId }) {
  const [expanded, setExpanded] = useState(false);
  const [links, setLinks] = useState(null);

  useEffect(() => {
    loadLinks().then(setLinks);
  }, []);

  if (!links) return null;
  const lookup = itemById();
  const commonNavSet = new Set(links.commonNav || []);
  const outbound = resolveAndSort(links.outbound?.[itemId] || [], commonNavSet, lookup);
  const inbound = resolveAndSort(links.inbound?.[itemId] || [], commonNavSet, lookup);

  if (outbound.length === 0 && inbound.length === 0) return null;

  return (
    <div className="item-links">
      <button type="button" className="links-toggle" onClick={() => setExpanded((e) => !e)}>
        <span className="links-toggle-caret">{expanded ? '▾' : '▸'}</span>
        {outbound.length > 0 && <span className="links-toggle-primary">Links to {outbound.length}</span>}
        {inbound.length > 0 && <span className="links-toggle-secondary">Linked from {inbound.length}</span>}
      </button>
      {expanded && (
        <div className="links-detail">
          {outbound.length > 0 && <LinkGroup label="Links to" items={outbound} primary />}
          {inbound.length > 0 && <LinkGroup label="Linked from" items={inbound} />}
        </div>
      )}
    </div>
  );
}

function LinkGroup({ label, items, primary }) {
  return (
    <div className={`links-group ${primary ? 'primary' : ''}`}>
      <span className="links-group-label">{label}</span>
      <ul className="links-chip-list">
        {items.map((t) => (
          <li key={t.id}>
            <a href={t.url} target="_blank" rel="noreferrer" className={`link-chip type-${t.type}`}>
              {t.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
