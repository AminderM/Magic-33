import React, { useState, useEffect, createContext, useContext } from 'react';

// Context for driver app state
const DriverAppContext = createContext(null);

export const useDriverApp = () => {
  const context = useContext(DriverAppContext);
  if (!context) throw new Error('useDriverApp must be used within DriverAppProvider');
  return context;
};

// Mobile detection - blocks large screens (desktop)
const isMobileDevice = () => {
  const isSmallScreen = window.innerWidth <= 768;
  return isSmallScreen;
};

// Mobile Block Screen
const MobileBlockScreen = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
    <div className="bg-gray-900 rounded-2xl p-8 max-w-md text-center border border-gray-800">
      <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Mobile Only</h1>
      <p className="text-gray-400 mb-6">
        This driver app is designed for mobile devices only. Please open it on your smartphone to continue.
      </p>
      <div className="bg-gray-800/50 rounded-lg p-4">
        <p className="text-sm text-gray-300">Visit this URL on your phone:</p>
        <p className="text-red-400 font-mono text-sm mt-2 break-all">{window.location.href}</p>
      </div>
    </div>
  </div>
);

// Location Permission Screen
const LocationPermissionScreen = ({ onRetry, error }) => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
    <div className="bg-gray-900 rounded-2xl p-8 max-w-md text-center border border-gray-800">
      <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Location Required</h1>
      <p className="text-gray-400 mb-6">
        Location access is required to use this driver app. Your location helps dispatch track deliveries.
      </p>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-red-400 font-medium mb-2">Permission Denied</p>
          <p className="text-sm text-gray-300">Enable location in your device settings, then tap below.</p>
        </div>
      )}
      
      <button
        onClick={onRetry}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
      >
        Enable Location
      </button>
    </div>
  </div>
);

// Main Driver App Provider
export const DriverAppProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(true);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeLoadId, setActiveLoadId] = useState(null);

  // Check device type
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(isMobileDevice());
      setIsCheckingDevice(false);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Load auth state
  useEffect(() => {
    const savedToken = localStorage.getItem('driver_app_token');
    const savedUser = localStorage.getItem('driver_app_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Request location permission
  const requestLocation = async () => {
    setLocationError(null);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_m: position.coords.accuracy
      });
      setLocationGranted(true);
    } catch (error) {
      setLocationError(error.message);
      setLocationGranted(false);
    }
  };

  // Location tracking
  useEffect(() => {
    if (!locationGranted || !user) return;
    
    const interval = activeLoadId ? 30000 : 180000;
    
    const updateLocation = async (position) => {
      const loc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_m: position.coords.accuracy,
        load_id: activeLoadId
      };
      setCurrentLocation(loc);
      
      try {
        await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile/location/ping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(loc)
        });
      } catch (err) {
        console.error('Location ping failed:', err);
      }
    };
    
    const watchId = navigator.geolocation.watchPosition(updateLocation, () => {}, {
      enableHighAccuracy: true,
      maximumAge: interval
    });
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationGranted, user, token, activeLoadId]);

  // Login
  const login = async (email, password) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('driver_app_token', data.access_token);
    localStorage.setItem('driver_app_user', JSON.stringify(data.user));
    return data;
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setLocationGranted(false);
    localStorage.removeItem('driver_app_token');
    localStorage.removeItem('driver_app_user');
  };

  // API helper
  const api = async (endpoint, options = {}) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/driver-mobile${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }
    
    return response.json();
  };

  const value = {
    user, token, login, logout, api,
    currentLocation, activeLoadId, setActiveLoadId,
    locationGranted, requestLocation
  };

  if (isCheckingDevice) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isMobile) return <MobileBlockScreen />;
  
  if (user && !locationGranted) {
    return <LocationPermissionScreen onRetry={requestLocation} error={locationError} />;
  }

  return (
    <DriverAppContext.Provider value={value}>
      {children}
    </DriverAppContext.Provider>
  );
};

export default DriverAppProvider;
