import { mapTree, removeFromTree, addChildToTree, newId } from '../utils/tree';
import { LiveTextInput } from './LiveInputs';

export default function TreeEditor({ nodes, onChange, addLabel = 'item' }) {
  const handleUpdate = (id, patch) => onChange(mapTree(nodes, id, (n) => ({ ...n, ...patch })));
  const handleDelete = (id, title) => {
    if (!confirm(`Remove "${title}" from the navigation? This also removes any sub-items.`)) return;
    onChange(removeFromTree(nodes, id));
  };
  const handleAddChild = (parentId) =>
    onChange(addChildToTree(nodes, parentId, { id: newId(), title: 'New item', children: [] }));
  const handleAddRoot = () => onChange([...nodes, { id: newId(), title: 'New item', children: [] }]);

  return (
    <div className="tree-editor">
      <ul className="tree">
        {nodes.map((n) => (
          <NodeEditor
            key={n.id}
            node={n}
            depth={0}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        ))}
      </ul>
      <button type="button" className="btn-ghost add-root-btn" onClick={handleAddRoot}>
        + Add {addLabel}
      </button>
    </div>
  );
}

function NodeEditor({ node, depth, onUpdate, onDelete, onAddChild }) {
  const hasChildren = Boolean(node.children && node.children.length);
  return (
    <li className="tree-node">
      <div className={`tree-row editable-row ${node.note ? 'is-note' : ''}`}>
        <span className={`tree-bullet ${depth === 0 ? 'root' : ''}`} />
        <LiveTextInput
          className="tree-input"
          value={node.title}
          placeholder="Item title"
          onCommit={(v) => onUpdate(node.id, { title: v })}
        />
        <label className="note-toggle" title="Mark as a design note / callout instead of a real nav item">
          <input type="checkbox" checked={Boolean(node.note)} onChange={(e) => onUpdate(node.id, { note: e.target.checked })} />
          note
        </label>
        <div className="row-actions">
          <button type="button" className="icon-btn" onClick={() => onAddChild(node.id)}>+ child</button>
          <button type="button" className="icon-btn danger" onClick={() => onDelete(node.id, node.title)}>Delete</button>
        </div>
      </div>
      {hasChildren && (
        <ul className="tree-children">
          {node.children.map((c) => (
            <NodeEditor key={c.id} node={c} depth={depth + 1} onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} />
          ))}
        </ul>
      )}
    </li>
  );
}
