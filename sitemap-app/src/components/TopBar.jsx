import SyncBadge from './SyncBadge';

export default function TopBar({ tabs, tab, onTabChange, deletedState }) {
  const { deleted, resetToSuggested, clearAll, status } = deletedState;

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-text">
          <strong>Peace At Home Parenting</strong>
          <span>Sitemap &amp; Navigation Planner</span>
        </div>
      </div>
      <nav className="topbar-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => onTabChange(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="topbar-actions">
        <SyncBadge status={status} />
        <span className="deleted-count">{deleted.size} marked deleted</span>
        <button type="button" className="btn-ghost" onClick={resetToSuggested} title="Reset checkboxes to the automated suggestions">
          Reset to suggested
        </button>
        <button type="button" className="btn-ghost" onClick={clearAll} title="Unmark everything">
          Clear all
        </button>
      </div>
    </header>
  );
}
