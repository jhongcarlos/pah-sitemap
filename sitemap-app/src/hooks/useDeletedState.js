import { useMemo } from 'react';
import { useFirestoreDoc } from './useFirestoreDoc';

// Marked-deleted state lives in Firestore doc app/decisions as { [itemId]: true }
// (absent key = not deleted). Every open tab/browser subscribes to the same
// document, so a checkbox toggled anywhere shows up everywhere in realtime —
// there is no export/import step and no local-only copy once Firebase is
// configured.
export function useDeletedState(items) {
  const defaultData = useMemo(() => {
    const seed = {};
    items.forEach((i) => {
      if (i.suggestedDelete) seed[i.id] = true;
    });
    return seed;
  }, [items]);

  const { data, save, status } = useFirestoreDoc('app', 'decisions', defaultData);

  const deleted = useMemo(() => new Set(Object.keys(data).filter((id) => data[id])), [data]);

  const toggle = (id) => {
    const next = { ...data };
    if (next[id]) delete next[id];
    else next[id] = true;
    save(next);
  };

  const setMany = (ids, value) => {
    const next = { ...data };
    ids.forEach((id) => {
      if (value) next[id] = true;
      else delete next[id];
    });
    save(next);
  };

  const resetToSuggested = () => {
    const next = {};
    items.forEach((i) => {
      if (i.suggestedDelete) next[i.id] = true;
    });
    save(next);
  };

  const clearAll = () => save({});

  return { deleted, toggle, setMany, resetToSuggested, clearAll, status };
}
