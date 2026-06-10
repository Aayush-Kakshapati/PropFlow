import apiClient from './client';

const propertyService = {
  getAll: () => apiClient.get('/api/properties'),
  create: (data) => apiClient.post('/api/properties', data),
  update: (id, data) => apiClient.patch(`/api/properties/${id}`, data),
  delete: (id) => apiClient.delete(`/api/properties/${id}`),
};

export default propertyService;


