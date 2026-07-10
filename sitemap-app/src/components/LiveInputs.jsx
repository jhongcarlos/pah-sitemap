import { useEffect, useRef, useState } from 'react';

// A text input that stays in sync with realtime updates from Firestore
// (the `value` prop) while the user isn't actively typing in it, but doesn't
// fight the user's own keystrokes or get overwritten mid-edit. Commits on
// blur/Enter, same as a normal uncontrolled field would, via onCommit.
export function LiveTextInput({ value, onCommit, className, placeholder, type = 'text' }) {
  const [local, setLocal] = useState(value ?? '');
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(value ?? '');
  }, [value]);

  return (
    <input
      type={type}
      className={className}
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={() => { focused.current = true; }}
      onBlur={(e) => {
        focused.current = false;
        if (e.target.value !== value) onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

export function LiveTextarea({ value, onCommit, className, rows = 2 }) {
  const [local, setLocal] = useState(value ?? '');
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(value ?? '');
  }, [value]);

  return (
    <textarea
      className={className}
      rows={rows}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={() => { focused.current = true; }}
      onBlur={(e) => {
        focused.current = false;
        if (e.target.value !== value) onCommit(e.target.value);
      }}
    />
  );
}
