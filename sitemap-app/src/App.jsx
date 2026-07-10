import { useMemo, useState } from 'react';
import data from './data/sitemap.json';
import { useDeletedState } from './hooks/useDeletedState';
import { isFirebaseConfigured } from './lib/firebase';
import Overview from './components/Overview';
import PageExplorer from './components/PageExplorer';
import ContentExplorer from './components/ContentExplorer';
import NavigationEditor from './components/NavigationEditor';
import TopBar from './components/TopBar';
import NotConfiguredBanner from './components/NotConfiguredBanner';
import './index.css';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'navigation', label: 'Navigation Plan' },
  { key: 'pages', label: 'Pages' },
  { key: 'courses', label: 'Courses' },
  { key: 'lessons', label: 'Lessons' },
  { key: 'events', label: 'Events' },
];

export default function App() {
  const [tab, setTab] = useState('overview');

  const allItems = useMemo(
    () => [...data.pages, ...data.courses, ...data.lessons, ...data.events],
    [],
  );
  const deletedState = useDeletedState(allItems);

  return (
    <div className="app-shell">
      <TopBar tab={tab} onTabChange={setTab} tabs={TABS} deletedState={deletedState} />
      <main className="app-main">
        {!isFirebaseConfigured && <NotConfiguredBanner />}
        {tab === 'overview' && (
          <Overview data={data} deletedState={deletedState} onNavigate={setTab} />
        )}
        {tab === 'navigation' && <NavigationEditor />}
        {tab === 'pages' && <PageExplorer pages={data.pages} deletedState={deletedState} />}
        {tab === 'courses' && (
          <ContentExplorer items={data.courses} type="course" deletedState={deletedState} />
        )}
        {tab === 'lessons' && (
          <ContentExplorer items={data.lessons} type="lesson" deletedState={deletedState} />
        )}
        {tab === 'events' && (
          <ContentExplorer items={data.events} type="event" deletedState={deletedState} />
        )}
      </main>
    </div>
  );
}
