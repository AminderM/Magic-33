import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Apply company theme on load if present
  useEffect(() => {
    async function applyStoredTheme() {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');
        if (!storedToken || !storedUser) return;
        // Try to fetch company and apply theme
        let res = await fetch(`${backendUrl}/api/companies/current`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!res.ok) {
          // Fallback for fleet_owner route
          res = await fetch(`${backendUrl}/api/companies/my`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
        }
        if (res.ok) {
          const company = await res.json();
          if (company?.theme) {
            Object.entries(company.theme).forEach(([k, v]) => {
              document.documentElement.style.setProperty(k, v);
            });
          }
        }
      } catch (e) {
        // non-blocking
      }
    }
    applyStoredTheme();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        const { access_token, user: userData } = data;
        
        // Store in state
        setToken(access_token);
        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        return true;
      } else {
        throw new Error(data.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  const getAuthHeaders = () => {
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  };

  const fetchWithAuth = async (url, options = {}) => {
    const authHeaders = getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token expired or invalid, logout user
      logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    getAuthHeaders,
    fetchWithAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};