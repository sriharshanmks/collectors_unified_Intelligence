import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('farmai_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('farmai_token');
      const storedUser = localStorage.getItem('farmai_user');
      
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user data from server in background
          const freshUser = await api.auth.getMe();
          setUser(freshUser);
          localStorage.setItem('farmai_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session expired or invalid, logging out', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('farmai_token', data.access_token);
    localStorage.setItem('farmai_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('farmai_token', data.access_token);
    localStorage.setItem('farmai_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('farmai_token');
    localStorage.removeItem('farmai_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
