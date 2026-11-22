import { useCallback, useState } from 'react';

/** Small per-device preferences kept in localStorage (safe if storage is unavailable). */
export function usePref<T>(key: string, initial: T): [T, (v: T) => void] {
  const storageKey = 'zerofs.pref.' + key;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(storageKey, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );
  return [value, set];
}
