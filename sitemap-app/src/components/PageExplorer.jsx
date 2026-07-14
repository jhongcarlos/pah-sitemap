import { useMemo, useState } from 'react';
import { PAGE_CATEGORIES } from '../data/categories';
import ItemLinks from './ItemLinks';

export default function PageExplorer({ pages, deletedState }) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hideDeleted, setHideDeleted] = useState(false);
  const { deleted, toggle } = deletedState;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (hideDeleted && deleted.has(p.id)) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [pages, query, categoryFilter, hideDeleted, deleted]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((p) => {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category).push(p);
    });
    return map;
  }, [filtered]);

  return (
    <div className="explorer">
      <div className="explorer-toolbar">
        <input
          type="search"
          placeholder="Search pages by title or URL…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-input">
          <option value="all">All categories</option>
          {PAGE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <label className="checkbox-inline">
          <input type="checkbox" checked={hideDeleted} onChange={(e) => setHideDeleted(e.target.checked)} />
          Hide marked-deleted
        </label>
        <span className="result-count">{filtered.length} of {pages.length}</span>
      </div>

      {PAGE_CATEGORIES.filter((c) => grouped.has(c.key)).map((cat) => (
        <section key={cat.key} className="category-section">
          <h3>{cat.label} <span className="pill">{grouped.get(cat.key).length}</span></h3>
          <p className="category-blurb">{cat.blurb}</p>
          <ul className="item-list">
            {grouped.get(cat.key).map((p) => (
              <PageRow key={p.id} page={p} isDeleted={deleted.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </ul>
        </section>
      ))}

      {filtered.length === 0 && <p className="empty-state">No pages match your filters.</p>}
    </div>
  );
}

function PageRow({ page, isDeleted, onToggle }) {
  return (
    <li className={`item-row ${isDeleted ? 'deleted' : ''}`}>
      <label className="item-checkbox">
        <input type="checkbox" checked={isDeleted} onChange={onToggle} />
      </label>
      <div className="item-body">
        <div className="item-title-line">
          <span className="item-title">{page.title}</span>
          {page.suggestedDelete && <span className="suggested-tag">suggested removal</span>}
        </div>
        <a href={page.url} target="_blank" rel="noreferrer" className="item-url">{page.url}</a>
        {page.suggestedReason && <span className="item-reason">{page.suggestedReason}</span>}
        <ItemLinks itemId={page.id} />
      </div>
    </li>
  );
}
