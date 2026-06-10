import React, { createContext, useContext, useEffect, useState } from 'react';
import { login, logout, getStoredUser } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const stored = await getStoredUser();
        if (stored) setUser(stored);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function signIn(username, password) {
    const data = await login(username, password);
    setUser(data);
  }

  async function signOut() {
    await logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}