export default function NotConfiguredBanner() {
  return (
    <div className="not-configured-banner">
      <strong>Not connected to a database yet.</strong>
      <p>
        Marked-deleted checkboxes and navigation edits are not being saved or synced right now. Add your Firebase
        project keys to a <code>.env</code> file (see <code>.env.example</code>) and restart the app to enable
        realtime saving and multi-person editing.
      </p>
    </div>
  );
}
