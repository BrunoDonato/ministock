import React, { createContext, useContext, useState } from 'react';

const ProductsContext = createContext();

export function ProductsProvider({ children }) {
  const [localProducts, setLocalProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState({});
  const [removedIds, setRemovedIds] = useState([]);

  function addProduct(product) {
    const newProduct = { ...product, id: Date.now() };
    setLocalProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }

  function updateProduct(id, data) {
    setLocalProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    setEditedProducts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data },
    }));
  }

  function removeProduct(id) {
    setLocalProducts((prev) => prev.filter((p) => p.id !== id));
    setEditedProducts((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setRemovedIds((prev) => [...prev, id]);
  }

  function mergeWithEdits(apiProducts, filterCategory = null) {
    return apiProducts
      .filter((p) => !removedIds.includes(p.id))
      .map((p) => (editedProducts[p.id] ? { ...p, ...editedProducts[p.id] } : p))
      .filter((p) => !filterCategory || p.category === filterCategory);
  }

  return (
    <ProductsContext.Provider value={{ localProducts, editedProducts, addProduct, updateProduct, removeProduct, mergeWithEdits }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}