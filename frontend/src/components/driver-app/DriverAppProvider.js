import React, { useState, useEffect, createContext, useContext } from 'react';
import { Smartphone, MapPin, AlertTriangle, Settings } from 'lucide-react';

// Context for driver app state
const DriverAppContext = createContext(null);

export const useDriverApp = () => {
  const context = useContext(DriverAppContext);
  if (!context) throw new Error('useDriverApp must be used within DriverAppProvider');
  return context;
};

// Mobile detection
const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  return (isMobileUA || isTouchDevice) && isSmallScreen;
};

// Mobile Block Screen
const MobileBlockScreen = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
    <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center border border-slate-700">
      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Smartphone className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Mobile Only</h1>
      <p className="text-slate-400 mb-6">
        This driver app is designed for mobile devices only. Please open it on your smartphone to continue.
      </p>
      <div className="bg-slate-700/50 rounded-lg p-4">
        <p className="text-sm text-slate-300">
          Scan the QR code or visit this URL on your phone:
        </p>
        <p className="text-blue-400 font-mono text-sm mt-2 break-all">
          {window.location.href}
        </p>
      </div>
    </div>
  </div>
);

// Location Permission Screen
const LocationPermissionScreen = ({ onRetry, error }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
    <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center border border-slate-700">
      <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <MapPin className="w-10 h-10 text-amber-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Location Required</h1>
      <p className="text-slate-400 mb-6">
        Location access is required to use this driver app. Your location helps dispatch track deliveries and provide better support.
      </p>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Permission Denied</span>
          </div>
          <p className="text-sm text-slate-300">
            Please enable location in your device settings:
          </p>
          <ol className="text-left text-sm text-slate-400 mt-2 space-y-1">
            <li>1. Open device Settings</li>
            <li>2. Go to Privacy → Location Services</li>
            <li>3. Find your browser and enable location</li>
            <li>4. Return here and tap "Enable Location"</li>
          </ol>
        </div>
      )}
      
      <button
        onClick={onRetry}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <MapPin className="w-5 h-5" />
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
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeLoadId, setActiveLoadId] = useState(null);

  // Check device type on mount and resize
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
    setIsCheckingLocation(true);
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
        accuracy_m: position.coords.accuracy,
        speed_mps: position.coords.speed,
        heading_deg: position.coords.heading
      });
      setLocationGranted(true);
      setLocationError(null);
    } catch (error) {
      console.error('Location error:', error);
      setLocationError(error.message || 'Location access denied');
      setLocationGranted(false);
    } finally {
      setIsCheckingLocation(false);
    }
  };

  // Start location tracking
  useEffect(() => {
    if (!locationGranted || !user) return;
    
    let watchId;
    const interval = activeLoadId ? 30000 : 180000; // 30s with active load, 3min otherwise
    
    const updateLocation = async (position) => {
      const loc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy_m: position.coords.accuracy,
        speed_mps: position.coords.speed,
        heading_deg: position.coords.heading,
        load_id: activeLoadId
      };
      setCurrentLocation(loc);
      
      // Send to server
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
        console.error('Failed to send location:', err);
      }
    };
    
    // Watch position
    watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => console.error('Watch error:', err),
      { enableHighAccuracy: true, maximumAge: interval, timeout: 10000 }
    );
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [locationGranted, user, token, activeLoadId]);

  // Login function
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

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
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
    user,
    token,
    login,
    logout,
    api,
    currentLocation,
    activeLoadId,
    setActiveLoadId,
    locationGranted
  };

  // Loading state
  if (isCheckingDevice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Block non-mobile devices
  if (!isMobile) {
    return <MobileBlockScreen />;
  }

  // Location permission gate (only after login)
  if (user && !locationGranted) {
    return (
      <LocationPermissionScreen 
        onRetry={requestLocation} 
        error={locationError}
      />
    );
  }

  return (
    <DriverAppContext.Provider value={value}>
      {children}
    </DriverAppContext.Provider>
  );
};

export default DriverAppProvider;
