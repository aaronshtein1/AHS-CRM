import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token from localStorage if available
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Patients API
export const patientsApi = {
  list: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
    ownerId?: string;
    status?: string;
    hasActiveProcess?: boolean;
  }) => {
    const { data } = await api.get('/patients', { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get(`/patients/${id}`);
    return data;
  },
  create: async (patient: any) => {
    const { data } = await api.post('/patients', patient);
    return data;
  },
  update: async (id: string, patient: any) => {
    const { data } = await api.patch(`/patients/${id}`, patient);
    return data;
  },
  assign: async (id: string, ownerId: string) => {
    const { data } = await api.post(`/patients/${id}/assign`, { ownerId });
    return data;
  },
};

// Patient sub-resources
export const patientContactsApi = {
  list: async (patientId: string) => {
    const { data } = await api.get(`/patients/${patientId}/contacts`);
    return data;
  },
  create: async (patientId: string, contact: any) => {
    const { data } = await api.post(`/patients/${patientId}/contacts`, contact);
    return data;
  },
  update: async (patientId: string, contactId: string, contact: any) => {
    const { data } = await api.patch(`/patients/${patientId}/contacts/${contactId}`, contact);
    return data;
  },
  delete: async (patientId: string, contactId: string) => {
    await api.delete(`/patients/${patientId}/contacts/${contactId}`);
  },
};

export const patientAddressesApi = {
  list: async (patientId: string) => {
    const { data } = await api.get(`/patients/${patientId}/addresses`);
    return data;
  },
  create: async (patientId: string, address: any) => {
    const { data } = await api.post(`/patients/${patientId}/addresses`, address);
    return data;
  },
  update: async (patientId: string, addressId: string, address: any) => {
    const { data } = await api.patch(`/patients/${patientId}/addresses/${addressId}`, address);
    return data;
  },
  delete: async (patientId: string, addressId: string) => {
    await api.delete(`/patients/${patientId}/addresses/${addressId}`);
  },
};

// Updates API
export const updatesApi = {
  list: async (patientId: string, params?: { type?: string; processInstanceId?: string }) => {
    const { data } = await api.get(`/patients/${patientId}/updates`, { params });
    return data;
  },
  create: async (patientId: string, content: string, options?: { processInstanceId?: string }) => {
    const { data } = await api.post(`/patients/${patientId}/updates`, { content, ...options });
    return data;
  },
};

// Process Templates API
export const processTemplatesApi = {
  list: async () => {
    const { data } = await api.get('/process-templates');
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get(`/process-templates/${id}`);
    return data;
  },
  create: async (template: any) => {
    const { data } = await api.post('/process-templates', template);
    return data;
  },
  update: async (id: string, template: any) => {
    const { data } = await api.patch(`/process-templates/${id}`, template);
    return data;
  },
};

// Process Instances API
export const processInstancesApi = {
  listByPatient: async (patientId: string) => {
    const { data } = await api.get(`/patients/${patientId}/processes`);
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get(`/process-instances/${id}`);
    return data;
  },
  create: async (patientId: string, instance: { processTemplateId: string; assignedToId?: string; notes?: string }) => {
    const { data } = await api.post(`/patients/${patientId}/processes`, instance);
    return data;
  },
  advanceStage: async (instanceId: string, stageId: string, data?: { notes?: string }) => {
    const response = await api.post(`/process-instances/${instanceId}/stages/${stageId}/advance`, data || {});
    return response.data;
  },
  cancel: async (id: string, reason: string) => {
    const { data } = await api.post(`/process-instances/${id}/cancel`, { reason });
    return data;
  },
  hold: async (id: string, reason: string) => {
    const { data } = await api.post(`/process-instances/${id}/hold`, { reason });
    return data;
  },
  resume: async (id: string) => {
    const { data } = await api.post(`/process-instances/${id}/resume`);
    return data;
  },
  reopen: async (id: string) => {
    const { data } = await api.post(`/process-instances/${id}/reopen`);
    return data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const { data } = await api.get('/dashboard/stats');
    return data;
  },
  getMyPatients: async () => {
    const { data } = await api.get('/dashboard/my-patients');
    return data;
  },
  getMyProcesses: async () => {
    const { data } = await api.get('/dashboard/my-processes');
    return data;
  },
  getDueToday: async () => {
    const { data } = await api.get('/dashboard/due-today');
    return data;
  },
  getOverdue: async () => {
    const { data } = await api.get('/dashboard/overdue');
    return data;
  },
  getRecentActivity: async () => {
    const { data } = await api.get('/dashboard/recent-activity');
    return data;
  },
};

// Users API
export const usersApi = {
  list: async () => {
    const { data } = await api.get('/users');
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  create: async (user: any) => {
    const { data } = await api.post('/users', user);
    return data;
  },
  update: async (id: string, user: any) => {
    const { data } = await api.patch(`/users/${id}`, user);
    return data;
  },
};

// Tasks API
export const tasksApi = {
  list: async (params?: any) => {
    const { data } = await api.get('/tasks', { params });
    return data;
  },
  create: async (task: any) => {
    const { data } = await api.post('/tasks', task);
    return data;
  },
  complete: async (id: string) => {
    const { data } = await api.post(`/tasks/${id}/complete`);
    return data;
  },
};

// Communications API
export const communicationsApi = {
  listByPatient: async (patientId: string) => {
    const { data } = await api.get(`/patients/${patientId}/communications`);
    return data;
  },
  sendEmail: async (data: { patientId: string; to: string; subject: string; body: string }) => {
    const response = await api.post('/communications/send-email', data);
    return response.data;
  },
  sendSms: async (data: { patientId: string; to: string; body: string }) => {
    const response = await api.post('/communications/send-sms', data);
    return response.data;
  },
};
