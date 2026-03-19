const COMPARE_STORAGE_KEY = 'wenming_compare_candidates';

function getStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }

  return null;
}

export function setPendingCompareNames(names, storage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(Array.isArray(names) ? names : []));
}

export function getPendingCompareNames(storage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    return [];
  }

  try {
    const raw = targetStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('compare_session_parse_failed', error);
    return [];
  }
}

export function clearPendingCompareNames(storage) {
  const targetStorage = getStorage(storage);
  targetStorage?.removeItem(COMPARE_STORAGE_KEY);
}
