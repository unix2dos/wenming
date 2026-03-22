async function requestJSON(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let responseBody = null;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    const message = responseBody?.error || '请求失败，请稍后再试。';
    const error = new Error(message);
    error.status = response.status;
    error.retryAfter = responseBody?.retryAfter;
    error.limitType = responseBody?.limitType;
    throw error;
  }

  return responseBody;
}

export function generateNames(preferences) {
  return requestJSON('/api/generate', preferences);
}

export function scoreName(fullName, birthday = null) {
  return requestJSON('/api/score', { fullName, birthday });
}
