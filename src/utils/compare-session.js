const COMPARE_STORAGE_KEY = 'wenming_compare_candidates';
const COMPARE_FLOW_CONTEXT_KEY = 'wenming_compare_flow_context';

function getStorage(storage, preferSession = false) {
  if (storage) {
    return storage;
  }

  if (preferSession && typeof sessionStorage !== 'undefined') {
    return sessionStorage;
  }

  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }

  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage;
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

export function setCompareFlowContext(context, storage) {
  const targetStorage = getStorage(storage, true);
  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(COMPARE_FLOW_CONTEXT_KEY, JSON.stringify(context || null));
}

export function getCompareFlowContext(storage) {
  const targetStorage = getStorage(storage, true);
  if (!targetStorage) {
    return null;
  }

  try {
    const raw = targetStorage.getItem(COMPARE_FLOW_CONTEXT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('compare_flow_context_parse_failed', error);
    return null;
  }
}

export function clearCompareFlowContext(storage) {
  const targetStorage = getStorage(storage, true);
  targetStorage?.removeItem(COMPARE_FLOW_CONTEXT_KEY);
}
