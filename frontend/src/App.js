import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import AppsPage from './components/AppsPage';
import AdminConsole from './components/admin/AdminConsole';
import FeatureLoader from './components/FeatureLoader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is platform admin based on role only
  const isAdmin = user?.role === 'platform_admin';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <FeaturesProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><FeatureLoader><Dashboard /></FeatureLoader></ProtectedRoute>} />
              <Route path="/apps" element={<ProtectedRoute><FeatureLoader><AppsPage /></FeatureLoader></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><FeatureLoader><AdminConsole /></FeatureLoader></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </FeaturesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
