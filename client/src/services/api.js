const BASE = 'http://localhost:3001';

const handleResponse = async (response) => {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data?.error || message;
    } catch {
      // Ignore JSON parsing errors for empty/non-JSON responses
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const getNotes = () =>
  fetch(`${BASE}/notes`).then(handleResponse);

export const createNote = (note) =>
  fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  }).then(handleResponse);

export const updateNote = (id, note) =>
  fetch(`${BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  }).then(handleResponse);

export const deleteNote = (id) =>
  fetch(`${BASE}/notes/${id}`, { method: 'DELETE' }).then(handleResponse);

export const uploadFile = (file, filename = file?.name || 'upload.bin') => {
  const formData = new FormData();
  formData.append('file', file, filename);

  return fetch(`${BASE}/upload`, {
    method: 'POST',
    body: formData,
  }).then(handleResponse);
};

export const deleteFile = (filename) =>
  fetch(`${BASE}/upload/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  }).then(handleResponse);

export const getAbsoluteFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE}${url}`;
};