import sitemapData from './sitemap.json';

// Seeds the "urlMapping" Firestore document from the client's original
// planning workbook the first time the app runs. After that, all edits live
// in Firestore and this seed is never read again.
export function buildDefaultUrlMapping() {
  const rows = sitemapData.urlMapping.map((row, idx) => ({
    id: `seed-${idx + 1}`,
    title: row.title || '',
    oldUrl: row.oldUrl || '',
    newUrl: row.newUrl || '',
    status: row.status || '',
  }));
  return { rows };
}
