import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

// Subscribes to a single Firestore document in realtime. If the document
// doesn't exist yet, seeds it with `defaultData` so every reader/writer
// starts from the same baseline. `save(data)` overwrites the whole document
// (merge: true) and is what every editor call in the app uses to persist a
// change — there is no local-only state once Firebase is configured.
export function useFirestoreDoc(collectionName, docId, defaultData) {
  const [data, setData] = useState(defaultData);
  const [status, setStatus] = useState(isFirebaseConfigured ? 'connecting' : 'not-configured');
  const seededRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const ref = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setData(snap.data());
          setStatus('live');
        } else if (!seededRef.current) {
          seededRef.current = true;
          setDoc(ref, defaultData).catch(() => setStatus('error'));
        }
      },
      () => setStatus('error'),
    );
    return unsubscribe;
    // defaultData is only used for the initial seed; intentionally excluded
    // from deps so re-renders don't resubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, docId]);

  const save = (next) => {
    setData(next);
    if (!isFirebaseConfigured) return;
    const ref = doc(db, collectionName, docId);
    setDoc(ref, next, { merge: false }).catch(() => setStatus('error'));
  };

  return { data, save, status };
}
