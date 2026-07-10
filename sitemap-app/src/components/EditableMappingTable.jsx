import { newId } from '../utils/tree';
import { LiveTextInput } from './LiveInputs';

const STATUS_OPTIONS = ['Not started', 'Requested', 'In Progress', 'In Review', 'Completed'];

export default function EditableMappingTable({ rows, onChange }) {
  const update = (id, patch) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id) => {
    if (!confirm('Remove this row from the mapping table?')) return;
    onChange(rows.filter((r) => r.id !== id));
  };
  const add = () => onChange([...rows, { id: newId(), title: 'New nav item', oldUrl: '', newUrl: '', status: 'Not started' }]);

  return (
    <div className="table-wrap">
      <table className="mapping-table editable">
        <thead>
          <tr>
            <th>Nav Item</th>
            <th>Old URL</th>
            <th>New URL</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <LiveTextInput className="table-input" value={row.title} onCommit={(v) => update(row.id, { title: v })} />
              </td>
              <td>
                <LiveTextInput
                  className="table-input mono"
                  value={row.oldUrl}
                  placeholder="—"
                  onCommit={(v) => update(row.id, { oldUrl: v })}
                />
              </td>
              <td>
                <LiveTextInput
                  className="table-input mono"
                  value={row.newUrl}
                  placeholder="—"
                  onCommit={(v) => update(row.id, { newUrl: v })}
                />
              </td>
              <td>
                <select
                  className={`status-select status-${statusClass(row.status)}`}
                  value={row.status || 'Not started'}
                  onChange={(e) => update(row.id, { status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <button type="button" className="icon-btn danger" onClick={() => remove(row.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn-ghost add-root-btn" onClick={add}>+ Add row</button>
    </div>
  );
}

function statusClass(status) {
  const key = (status || '').toLowerCase();
  if (key.includes('complete')) return 'done';
  if (key.includes('progress')) return 'progress';
  if (key.includes('review')) return 'review';
  if (key.includes('request')) return 'requested';
  return 'unknown';
}
