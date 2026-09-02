export interface StorageEstimateInfo {
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
}

/** Request persistent storage if supported. Returns whether persistence was granted. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try {
    const granted = await navigator.storage.persist();
    return granted;
  } catch {
    return false;
  }
}

/** Check if storage is currently persisted. */
export async function isStoragePersisted(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return null;
  try {
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}

/** Get a storage estimate (usage/quota). Returns nulls if unsupported. */
export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  const info: StorageEstimateInfo = { usage: null, quota: null, persisted: null };
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return info;
  try {
    const est = await navigator.storage.estimate();
    info.usage = est.usage ?? null;
    info.quota = est.quota ?? null;
  } catch {
    // ignore
  }
  info.persisted = await isStoragePersisted();
  return info;
}
