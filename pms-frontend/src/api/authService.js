import apiClient from './client';

const authService = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  getMe: () => apiClient.get('/api/me'),
  getTenants: () => apiClient.get('/api/tenants'),
  createTenant: (data) => apiClient.post('/api/tenants', data),
  updateTenant: (id, data)=> apiClient.patch(`/api/tenants/${id}`, data),
  changePassword: (data) => apiClient.post('/api/auth/change-password', data),
};

export default authService;
