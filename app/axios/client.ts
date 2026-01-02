import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

const API_CONFIG = {
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const apiClient: AxiosInstance = axios.create(API_CONFIG);

apiClient.interceptors.request.use(

);

export default apiClient;