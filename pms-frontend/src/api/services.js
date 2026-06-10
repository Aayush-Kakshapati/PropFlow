import apiClient from './client';

export const leaseService = {
  getAll: () => apiClient.get('/api/leases'),
  create: (data) => apiClient.post('/api/leases', data),
  update: (id, data) => apiClient.patch(`/api/leases/${id}`, data),
  delete: (id) => apiClient.delete(`/api/leases/${id}`),
};

export const paymentService = {
  getAll: (params = {}) => apiClient.get('/api/payments', { params }),
  markPaid: (id, data = {}) => apiClient.patch(`/api/payments/${id}/pay`, data),
};

export const maintenanceService = {
  getOwnerRequests: () => apiClient.get('/api/maintenance'),
  create: (data) => apiClient.post('/api/maintenance', data),
  updateStatus: (id, data) => apiClient.patch(`/api/maintenance/${id}`, data),
};