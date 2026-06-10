import apiClient from './client';

const unitService = {
  getAll: () => apiClient.get('/api/units'),
  getByProperty: (propertyId) => apiClient.get('/api/units', { params: { property_id: propertyId } }),
  create: (data) => apiClient.post('/api/units', data),
  update: (id, data) => apiClient.patch(`/api/units/${id}`, data),
  delete: (id) => apiClient.delete(`/api/units/${id}`),
};

export default unitService;