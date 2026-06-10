import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@ministock:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED' || !error.response) {
      return Promise.reject(new Error('Sem conexão, tente novamente'));
    }

    const { status } = error.response;

    if (status === 401) {
      await AsyncStorage.removeItem('@ministock:token');
      await AsyncStorage.removeItem('@ministock:user');
      return Promise.reject(new Error('Sessão expirada, faça login novamente'));
    }

    if (status === 404) {
      return Promise.reject(new Error('Recurso não encontrado'));
    }

    if (status >= 500) {
      return Promise.reject(new Error('Erro no servidor, tente novamente'));
    }

    return Promise.reject(error);
  }
);

export default api;