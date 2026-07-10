import { useMemo, useState } from 'react';

const PAGE_SIZE = 100;

export default function ContentExplorer({ items, type, deletedState }) {
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [hideDeleted, setHideDeleted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { deleted, toggle } = deletedState;

  const clients = useMemo(() => {
    const set = new Set(items.map((i) => i.client).filter(Boolean));
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (clientFilter !== 'all' && i.client !== clientFilter) return false;
      if (hideDeleted && deleted.has(i.id)) return false;
      if (!q) return true;
      return i.title.toLowerCase().includes(q) || i.url.toLowerCase().includes(q);
    });
  }, [items, query, clientFilter, hideDeleted, deleted]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="explorer">
      <div className="explorer-toolbar">
        <input
          type="search"
          placeholder={`Search ${type}s by title or URL…`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="search-input"
        />
        {clients.length > 0 && (
          <select
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="select-input"
          >
            <option value="all">All clients / general</option>
            {clients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <label className="checkbox-inline">
          <input type="checkbox" checked={hideDeleted} onChange={(e) => setHideDeleted(e.target.checked)} />
          Hide marked-deleted
        </label>
        <span className="result-count">{filtered.length} of {items.length}</span>
      </div>

      <ul className="item-list flat">
        {visible.map((item) => (
          <li key={item.id} className={`item-row ${deleted.has(item.id) ? 'deleted' : ''}`}>
            <label className="item-checkbox">
              <input type="checkbox" checked={deleted.has(item.id)} onChange={() => toggle(item.id)} />
            </label>
            <div className="item-body">
              <div className="item-title-line">
                <span className="item-title">{item.title}</span>
                {item.client && <span className="client-tag">{item.client}</span>}
                {item.spanish && <span className="es-tag">ES</span>}
              </div>
              <a href={item.url} target="_blank" rel="noreferrer" className="item-url">{item.url}</a>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p className="empty-state">No {type}s match your filters.</p>}

      {visibleCount < filtered.length && (
        <button type="button" className="btn-ghost load-more" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
          Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more ({filtered.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
