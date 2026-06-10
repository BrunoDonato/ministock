import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export async function login(username, password) {
  try {
    const { data } = await api.post('/auth/login', { username, password });
    await AsyncStorage.setItem('@ministock:token', data.accessToken);
    await AsyncStorage.setItem('@ministock:user', JSON.stringify(data));
    return data;
  } catch (error) {
    console.log('Erro completo:', JSON.stringify(error));
    console.log('Response:', error.response);
    console.log('Code:', error.code);
    throw error;
  }
}

export async function logout() {
  await AsyncStorage.removeItem('@ministock:token');
  await AsyncStorage.removeItem('@ministock:user');
}

export async function getStoredUser() {
  const user = await AsyncStorage.getItem('@ministock:user');
  return user ? JSON.parse(user) : null;
}