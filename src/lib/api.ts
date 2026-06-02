const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch(path: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOpts,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: (token: string) =>
    apiFetch('/api/auth/logout', { method: 'POST', token }),
  me: (token: string) =>
    apiFetch('/api/auth/me', { token }),

  // Dashboard
  getStats: (token: string) =>
    apiFetch('/api/dashboard/stats', { token }),
  getPipeline: (token: string) =>
    apiFetch('/api/dashboard/pipeline', { token }),
  getRecentActivity: (token: string) =>
    apiFetch('/api/dashboard/recent-activity', { token }),

  // Leads (unified lifecycle)
  getLeads: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/leads${qs}`, { token });
  },
  getLead: (token: string, id: string) =>
    apiFetch(`/api/leads/${id}`, { token }),
  createLead: (token: string, data: any) =>
    apiFetch('/api/leads', { method: 'POST', body: JSON.stringify(data), token }),
  updateLead: (token: string, id: string, data: any) =>
    apiFetch(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  addLeadActivity: (token: string, id: string, data: any) =>
    apiFetch(`/api/leads/${id}/activity`, { method: 'POST', body: JSON.stringify(data), token }),

  // Updates / Timeline
  createUpdate: (token: string, data: any) =>
    apiFetch('/api/updates', { method: 'POST', body: JSON.stringify(data), token }),
  getUpdates: (token: string, params: Record<string, string>) => {
    const qs = '?' + new URLSearchParams(params).toString();
    return apiFetch(`/api/updates${qs}`, { token });
  },

  // Processes
  getTemplates: (token: string) =>
    apiFetch('/api/processes/templates', { token }),
  startProcess: (token: string, data: any) =>
    apiFetch('/api/processes/start', { method: 'POST', body: JSON.stringify(data), token }),
  advanceProcess: (token: string, instanceId: string, data?: { collectedDates?: Record<string, string> }) =>
    apiFetch(`/api/processes/${instanceId}/advance`, { method: 'POST', body: JSON.stringify(data || {}), token }),
  closeProcess: (token: string, instanceId: string, data: { outcome: 'WON' | 'LOST'; lostReason?: string; collectedDates?: Record<string, string> }) =>
    apiFetch(`/api/processes/${instanceId}/close`, { method: 'POST', body: JSON.stringify(data), token }),

  // Tasks
  getTasks: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/tasks${qs}`, { token });
  },
  getTaskSummary: (token: string) =>
    apiFetch('/api/tasks/summary', { token }),
  createTask: (token: string, data: any) =>
    apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data), token }),
  updateTask: (token: string, id: string, data: any) =>
    apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  deleteTask: (token: string, id: string) =>
    apiFetch(`/api/tasks/${id}`, { method: 'DELETE', token }),

  // Users
  getUsers: (token: string) =>
    apiFetch('/api/users', { token }),
  createUser: (token: string, data: any) =>
    apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data), token }),
  updateUser: (token: string, id: string, data: any) =>
    apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  // Performance
  getPerformance: (token: string) =>
    apiFetch('/api/performance', { token }),
};
