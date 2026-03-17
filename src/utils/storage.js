const STORAGE_KEY = 'wenming_saved_names';

export function getSavedNames() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to parse saved names from localStorage', err);
    return [];
  }
}

export function saveName(nameData) {
  const current = getSavedNames();
  // Prevent duplicates by full_name
  if (!current.some(item => item.full_name === nameData.full_name)) {
    current.push(nameData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
}

export function removeName(fullName) {
  let current = getSavedNames();
  current = current.filter(item => item.full_name !== fullName);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function isNameSaved(fullName) {
  const current = getSavedNames();
  return current.some(item => item.full_name === fullName);
}
