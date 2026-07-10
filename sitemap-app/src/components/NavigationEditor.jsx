import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { buildDefaultNavigation } from '../data/defaultNavigation';
import { buildDefaultUrlMapping } from '../data/defaultUrlMapping';
import TreeEditor from './TreeEditor';
import EditableChipList from './EditableChipList';
import EditableMappingTable from './EditableMappingTable';
import SyncBadge from './SyncBadge';
import { LiveTextarea } from './LiveInputs';

export default function NavigationEditor() {
  const { data: nav, save: saveNav, status: navStatus } = useFirestoreDoc('app', 'navigation', buildDefaultNavigation());
  const { data: mapping, save: saveMapping, status: mappingStatus } = useFirestoreDoc('app', 'urlMapping', buildDefaultUrlMapping());

  const portal = nav.portal || { description: '', nav: [], required: [] };
  const openClient = nav.openClient || { description: '', nav: [] };

  return (
    <div className="nav-preview">
      <section className="nav-block">
        <div className="nav-block-head">
          <h2>B2B Navigation</h2>
          <span className="nav-sub">Public marketing site</span>
          <SyncBadge status={navStatus} />
        </div>
        <p className="nav-block-desc">
          Primary + secondary nav for the public-facing marketing site. Click any title to edit it, check
          &quot;note&quot; for callouts that aren&apos;t real nav items, and use the buttons to add or remove entries.
        </p>
        <TreeEditor nodes={nav.b2b || []} onChange={(next) => saveNav({ ...nav, b2b: next })} addLabel="top-level item" />
      </section>

      <section className="nav-block">
        <div className="nav-block-head">
          <h2>Portal Navigation</h2>
          <span className="nav-sub">Logged-in client portals</span>
        </div>
        <EditableDescription
          value={portal.description}
          onSave={(text) => saveNav({ ...nav, portal: { ...portal, description: text } })}
        />
        <div className="nav-two-col">
          <div>
            <h4>Navigation</h4>
            <TreeEditor nodes={portal.nav || []} onChange={(next) => saveNav({ ...nav, portal: { ...portal, nav: next } })} addLabel="nav item" />
          </div>
          <div>
            <h4>Required per-client elements</h4>
            <EditableChipList
              items={portal.required || []}
              onChange={(next) => saveNav({ ...nav, portal: { ...portal, required: next } })}
              addLabel="requirement"
            />
          </div>
        </div>
      </section>

      <section className="nav-block">
        <div className="nav-block-head">
          <h2>Open Client Navigation</h2>
          <span className="nav-sub">Non-login client pages</span>
        </div>
        <EditableDescription
          value={openClient.description}
          onSave={(text) => saveNav({ ...nav, openClient: { ...openClient, description: text } })}
        />
        <TreeEditor nodes={openClient.nav || []} onChange={(next) => saveNav({ ...nav, openClient: { ...openClient, nav: next } })} addLabel="nav item" />
      </section>

      <section className="nav-block">
        <div className="nav-block-head">
          <h2>Old URL → New URL mapping</h2>
          <SyncBadge status={mappingStatus} />
        </div>
        <p className="nav-block-desc">
          Editable — click any cell to change it, pick a status from the dropdown, or add a new row entirely.
        </p>
        <EditableMappingTable rows={mapping.rows || []} onChange={(next) => saveMapping({ rows: next })} />
      </section>
    </div>
  );
}

function EditableDescription({ value, onSave }) {
  return <LiveTextarea className="description-input" value={value} onCommit={onSave} rows={2} />;
}
