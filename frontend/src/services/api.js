import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('farmai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  // Authentication
  auth: {
    login: async (credentials) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    register: async (userData) => {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    },
    getMe: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
  },

  // Collector & FIMMS Operations
  collector: {
    getDashboardStats: async (params = {}) => {
      const response = await apiClient.get('/collector/dashboard-stats', { params });
      return response.data;
    },
    getEntities: async (params = {}) => {
      const response = await apiClient.get('/collector/entities', { params });
      return response.data;
    },
    createEntity: async (entityData) => {
      const response = await apiClient.post('/collector/entities', entityData);
      return response.data;
    },
    getUsersSummary: async (params = {}) => {
      const response = await apiClient.get('/collector/users/summary', { params });
      return response.data;
    },
    getReports: async (params = {}) => {
      const response = await apiClient.get('/collector/reports', { params });
      return response.data;
    },
    getIssues: async (params = {}) => {
      const response = await apiClient.get('/collector/issues', { params });
      return response.data;
    },
    updateIssue: async (issueId, updateData) => {
      const response = await apiClient.patch(`/collector/issues/${issueId}`, updateData);
      return response.data;
    },
    getMapData: async () => {
      const response = await apiClient.get('/collector/map-data');
      return response.data;
    },
  },

  // Citizen Complaints
  complaints: {
    submit: async (complaintData) => {
      const response = await apiClient.post('/complaints', complaintData);
      return response.data;
    },
    getAll: async () => {
      const response = await apiClient.get('/complaints/all');
      return response.data;
    },
    getMy: async () => {
      const response = await apiClient.get('/complaints/my');
      return response.data;
    },
  },

  // News Wire & AI Triage
  news: {
    getNews: async (params = {}) => {
      const response = await apiClient.get('/news', { params });
      return response.data;
    },
    triageWire: async (district = 'Yadadri Bhuvanagiri') => {
      const response = await apiClient.post('/news/triage-wire', null, { params: { district } });
      return response.data;
    },
  },

  // RAG Intelligence Assistant & Provider Switcher
  rag: {
    query: async (query, mandal = null, category = null) => {
      const response = await apiClient.post('/rag/query', { query, mandal, category });
      return response.data;
    },
    getProvider: async () => {
      const response = await apiClient.get('/rag/provider');
      return response.data;
    },
    switchProvider: async (provider, apiKey = null, modelId = null) => {
      const response = await apiClient.post('/rag/provider', { provider, api_key: apiKey, model_id: modelId });
      return response.data;
    },
  },
};
