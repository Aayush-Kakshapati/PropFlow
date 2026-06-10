import apiClient from './client';

const dashboardService = {
  getStats: () => apiClient.get('/api/dashboard'),
};

export default dashboardService;
