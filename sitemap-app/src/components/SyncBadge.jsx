const LABELS = {
  live: { text: 'Live', cls: 'live' },
  connecting: { text: 'Connecting…', cls: 'connecting' },
  error: { text: 'Sync error', cls: 'error' },
  'not-configured': { text: 'Not connected to a database', cls: 'error' },
};

export default function SyncBadge({ status }) {
  const info = LABELS[status] || LABELS.connecting;
  return <span className={`sync-badge ${info.cls}`}>{info.text}</span>;
}
