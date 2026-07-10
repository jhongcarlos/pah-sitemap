import { newId } from '../utils/tree';
import { LiveTextInput } from './LiveInputs';

export default function EditableChipList({ items, onChange, addLabel = 'item' }) {
  const update = (id, text) => onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  const remove = (id) => onChange(items.filter((i) => i.id !== id));
  const add = () => onChange([...items, { id: newId(), text: 'New item' }]);

  return (
    <div className="chip-editor">
      <ul className="chip-list muted editable">
        {items.map((item) => (
          <li key={item.id} className="chip editable-chip">
            <LiveTextInput className="chip-input" value={item.text} onCommit={(v) => update(item.id, v)} />
            <button type="button" className="chip-remove" onClick={() => remove(item.id)} aria-label="Remove">×</button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-ghost add-root-btn" onClick={add}>+ Add {addLabel}</button>
    </div>
  );
}
