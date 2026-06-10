import api from './api';

export async function listProducts({ limit = 10, skip = 0 }) {
  const { data } = await api.get('/products', { params: { limit, skip } });
  return data;
}

export async function searchProducts(q) {
  const { data } = await api.get('/products/search', { params: { q } });
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/products/category-list');
  return data;
}

export async function getProductsByCategory(category) {
  const { data } = await api.get(`/products/category/${category}`);
  return data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function createProduct(product) {
  const { data } = await api.post('/products/add', product);
  return data;
}

export async function updateProduct(id, product) {
  const { data } = await api.put(`/products/${id}`, product);
  return data;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}