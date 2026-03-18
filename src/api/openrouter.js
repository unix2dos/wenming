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
    throw new Error(message);
  }

  return responseBody;
}

export function generateNames(preferences) {
  return requestJSON('/api/generate', preferences);
}

export function scoreName(fullName) {
  return requestJSON('/api/score', { fullName });
}
