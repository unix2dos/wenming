const SESSION_STORAGE_KEY = 'wenming_session_id';

function getStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }

  return null;
}

export function getOrCreateSessionId({ storage, cryptoImpl } = {}) {
  const targetStorage = getStorage(storage);
  const targetCrypto = cryptoImpl || globalThis.crypto;

  if (!targetStorage) {
    return targetCrypto?.randomUUID?.() ?? `session-${Date.now()}`;
  }

  const existing = targetStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = targetCrypto?.randomUUID?.() ?? `session-${Date.now()}`;
  targetStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export async function trackEvent(eventName, options = {}) {
  if (typeof eventName !== 'string' || eventName.trim().length === 0) {
    return false;
  }

  const {
    page = null,
    payload = {},
    reportId = null,
    storage,
    cryptoImpl,
    fetchImpl = globalThis.fetch?.bind(globalThis),
  } = options;

  if (!fetchImpl) {
    return false;
  }

  const sessionId = getOrCreateSessionId({ storage, cryptoImpl });

  try {
    const response = await fetchImpl('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wenming-session-id': sessionId,
      },
      body: JSON.stringify({
        sessionId,
        reportId,
        eventName: eventName.trim(),
        page,
        payload,
      }),
      keepalive: true,
    });

    return Boolean(response?.ok);
  } catch (error) {
    console.error('track_event_failed', error);
    return false;
  }
}
