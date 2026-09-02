import { useEffect, useState } from 'react';

/**
 * Subscribe to a Dexie live query and return its result.
 * Re-runs whenever the query's dependencies change.
 */
import { liveQuery } from 'dexie';
import { getDb } from '../db/database';

export function useLiveQuery<T>(
  builder: () => Promise<T>,
  deps: unknown[] = [],
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    const query = liveQuery(() => {
      // Ensure db is initialized.
      getDb();
      return Promise.resolve(builder());
    });
    const sub = query.subscribe({
      next: (val) => {
        if (active) setValue(val);
      },
      error: (err) => {
        if (active) setError(err instanceof Error ? err : new Error(String(err)));
      },
    });
    return () => {
      active = false;
      sub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (error) {
    // Re-throw in render to be caught by error boundary; but for simplicity log.
    console.error('useLiveQuery error:', error);
  }
  return value;
}
