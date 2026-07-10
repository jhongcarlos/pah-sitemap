import { useMemo } from 'react';
import { PAGE_CATEGORIES } from '../data/categories';

export default function Overview({ data, deletedState, onNavigate }) {
  const { deleted } = deletedState;

  const categoryCounts = useMemo(() => {
    const counts = {};
    data.pages.forEach((p) => {
      if (!counts[p.category]) counts[p.category] = { total: 0, deleted: 0 };
      counts[p.category].total += 1;
      if (deleted.has(p.id)) counts[p.category].deleted += 1;
    });
    return counts;
  }, [data.pages, deleted]);

  const deletedByType = useMemo(() => {
    const all = [...data.pages, ...data.courses, ...data.lessons, ...data.events];
    return all.filter((i) => deleted.has(i.id)).length;
  }, [data, deleted]);

  return (
    <div className="overview">
      <section className="hero-panel">
        <h1>A clean map of everything on peaceathomeparenting.com</h1>
        <p>
          This planner pulls every page, course, lesson, and event currently live on the site and organizes it
          against the proposed new navigation. Nothing is deleted here — use the checkboxes on the{' '}
          <button className="link-btn" onClick={() => onNavigate('pages')}>Pages</button> tab (and the content
          tabs) to mark items for removal. Marked items stay visible, struck through, until everyone signs off.
        </p>
      </section>

      <section className="stat-strip">
        <StatCard label="Pages" value={data.meta.counts.pages} onClick={() => onNavigate('pages')} />
        <StatCard label="Courses" value={data.meta.counts.courses} onClick={() => onNavigate('courses')} />
        <StatCard label="Lessons" value={data.meta.counts.lessons} onClick={() => onNavigate('lessons')} />
        <StatCard label="Events" value={data.meta.counts.events} onClick={() => onNavigate('events')} />
        <StatCard label="Marked deleted" value={deletedByType} accent />
      </section>

      <section className="category-cards">
        <h2>Pages by category</h2>
        <p>Click any row to open it in the Pages tab.</p>
        <div className="card-grid">
          {PAGE_CATEGORIES.map((cat) => {
            const c = categoryCounts[cat.key] || { total: 0, deleted: 0 };
            return (
              <button key={cat.key} className="category-card" onClick={() => onNavigate('pages')} type="button">
                <div className="category-card-head">
                  <strong>{cat.label}</strong>
                  <span className="pill">{c.total}</span>
                </div>
                <p>{cat.blurb}</p>
                {c.deleted > 0 && <span className="warn-pill">{c.deleted} marked for removal</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, onClick, accent }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`stat-card ${accent ? 'accent' : ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </Tag>
  );
}
