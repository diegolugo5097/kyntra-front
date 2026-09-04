const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error de red');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  changePassword: (current_password, new_password) =>
    request('/api/auth/change-password', { method: 'POST', body: { current_password, new_password } }),
  me: () => request('/api/auth/me'),

  createUser: (name, email) => request('/api/users', { method: 'POST', body: { name, email } }),
  listUsers: () => request('/api/users'),

  getRoutine: (userId) => request(`/api/routines/${userId}`),
  createDay: (userId, name, sort_order) =>
    request(`/api/routines/${userId}/days`, { method: 'POST', body: { name, sort_order } }),
  deleteDay: (dayId) => request(`/api/routines/days/${dayId}`, { method: 'DELETE' }),
  createExercise: (dayId, data) =>
    request(`/api/routines/days/${dayId}/exercises`, { method: 'POST', body: data }),
  updateExercise: (exerciseId, data) =>
    request(`/api/routines/exercises/${exerciseId}`, { method: 'PUT', body: data }),
  deleteExercise: (exerciseId) => request(`/api/routines/exercises/${exerciseId}`, { method: 'DELETE' }),
  logSet: (exerciseId, data) =>
    request(`/api/routines/exercises/${exerciseId}/logs`, { method: 'POST', body: data }),
  getLogs: (exerciseId) => request(`/api/routines/exercises/${exerciseId}/logs`),

  setWeightUnit: (weight_unit) => request('/api/auth/unit', { method: 'PUT', body: { weight_unit } }),

  createBodyMetric: (userId, data) => request(`/api/body-metrics/${userId}`, { method: 'POST', body: data }),
  getBodyMetrics: (userId) => request(`/api/body-metrics/${userId}`),
  deleteBodyMetric: (id) => request(`/api/body-metrics/entry/${id}`, { method: 'DELETE' }),

  uploadMedia: (formData) => request('/api/media/upload', { method: 'POST', body: formData, isForm: true }),
  getMedia: (userId) => request(`/api/media/${userId}`),
  setObservation: (mediaId, observation) =>
    request(`/api/media/${mediaId}/observation`, { method: 'PUT', body: { observation } }),
  deleteMedia: (mediaId) => request(`/api/media/${mediaId}`, { method: 'DELETE' }),

  getChatHistory: (otherUserId) => request(`/api/chat/${otherUserId}`),
  sendMessage: (otherUserId, content) =>
    request(`/api/chat/${otherUserId}`, { method: 'POST', body: { content } }),

  getNotifications: () => request('/api/notifications'),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/api/notifications/read-all', { method: 'PUT' }),
};

export function wsUrl() {
  const base = API_URL.replace(/^http/, 'ws');
  return `${base}/ws?token=${getToken()}`;
}
