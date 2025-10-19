import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import useWebSocket from 'use-websocket';

const MobileDriverInterface = () => {
  const { vehicleId } = useParams();
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [battery, setBattery] = useState(100);
  const [signalStrength, setSignalStrength] = useState(100);
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const WS_URL = BACKEND_URL ? BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://') : 'ws://localhost:8001';

  // WebSocket connection for sending location data
  const { sendJsonMessage, lastMessage, connectionStatus: wsStatus } = useWebSocket(
    vehicleId ? `${WS_URL}/ws/vehicle/${vehicleId}` : null,
    {
      onOpen: () => {
        console.log('Vehicle WebSocket connected');
        setConnectionStatus('connected');
        toast.success('Connected to fleet tracking');
      },
      onClose: () => {
        console.log('Vehicle WebSocket disconnected');
        setConnectionStatus('disconnected');
        toast.info('Disconnected from fleet tracking');
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        toast.error('Connection error');
      },
      shouldReconnect: (closeEvent) => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000
    }
  );

  // Monitor battery level (Web API)
  useEffect(() => {
    const updateBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          setBattery(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setBattery(Math.round(battery.level * 100));
          });
        } catch (error) {
          console.log('Battery API not available');
        }
      }
    };
    
    updateBattery();
  }, []);

  // Monitor network connection
  useEffect(() => {
    const updateNetworkStatus = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        // Simulate signal strength based on connection type
        const strengthMap = {
          'cellular': 80,
          'wifi': 95,
          'ethernet': 100,
          'none': 0
        };
        setSignalStrength(strengthMap[connection.effectiveType] || 75);
      }
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this device');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000 // 5 seconds
    };

    const successCallback = (position) => {
      const now = Date.now();
      const coords = position.coords;
      
      const newLocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed || 0,
        heading: coords.heading || 0,
        timestamp: new Date().toISOString()
      };
      
      setLocationData(newLocationData);
      
      // Send location update every 10 seconds to avoid spam
      if (now - lastSentRef.current > 10000) {
        sendLocationUpdate(newLocationData);
        lastSentRef.current = now;
      }
    };

    const errorCallback = (error) => {
      console.error('Geolocation error:', error);
      let message = 'Unable to get your location.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Please enable location permissions.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out.';
          break;
      }
      
      toast.error(message);
      setIsTracking(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );
    
    setIsTracking(true);
    toast.success('GPS tracking started');
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.info('GPS tracking stopped');
  };

  const sendLocationUpdate = (locationData) => {
    if (connectionStatus === 'connected' && vehicleId) {
      sendJsonMessage({
        type: 'location_update',
        payload: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: locationData.speed,
          heading: locationData.heading,
          accuracy: locationData.accuracy
        }
      });
    }
  };

  const sendStatusUpdate = (status) => {
    if (connectionStatus === 'connected' && vehicleId) {
      sendJsonMessage({
        type: 'status_update',
        payload: {
          status: status,
          battery: battery,
          signal_strength: signalStrength
        }
      });
      toast.success(`Status updated: ${status}`);
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  return (
    <div className=\"max-w-md mx-auto space-y-4 p-4\">
      {/* Header */}
      <Card>
        <CardHeader className=\"text-center\">
          <CardTitle className=\"flex items-center justify-center space-x-2\">
            <i className=\"fas fa-mobile-alt text-blue-600\"></i>
            <span>Driver Mobile Interface</span>
          </CardTitle>
          <p className=\"text-sm text-gray-600\">
            Connected as: {user?.full_name}
          </p>
        </CardHeader>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardContent className=\"p-4\">
          <div className=\"flex items-center justify-between mb-4\">
            <span className=\"font-medium\">Connection Status</span>
            <Badge className={connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className=\"grid grid-cols-2 gap-4 text-sm\">
            <div className=\"text-center\">
              <div className=\"text-lg font-bold text-blue-600\">{battery}%</div>
              <div className=\"text-gray-600\">Battery</div>
            </div>
            <div className=\"text-center\">
              <div className=\"text-lg font-bold text-green-600\">{signalStrength}%</div>
              <div className=\"text-gray-600\">Signal</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPS Tracking Control */}
      <Card>
        <CardContent className=\"p-4\">
          <div className=\"flex items-center justify-between mb-4\">
            <div>
              <h3 className=\"font-medium\">GPS Tracking</h3>
              <p className=\"text-sm text-gray-600\">
                {isTracking ? 'Sending live location' : 'Location tracking off'}
              </p>
            </div>
            <Switch
              checked={isTracking}
              onCheckedChange={toggleTracking}
              disabled={connectionStatus !== 'connected'}
            />
          </div>
          
          {locationData && (
            <div className=\"space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded\">
              <div className=\"grid grid-cols-2 gap-2\">
                <div>Lat: {locationData.latitude.toFixed(6)}</div>
                <div>Lng: {locationData.longitude.toFixed(6)}</div>
                <div>Speed: {Math.round(locationData.speed * 2.237)} mph</div>
                <div>Accuracy: {Math.round(locationData.accuracy)}m</div>
              </div>
              <div className=\"text-center text-xs\">
                Last update: {new Date(locationData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Status Updates */}
      <Card>
        <CardHeader>
          <CardTitle className=\"text-lg\">Quick Status Update</CardTitle>
        </CardHeader>
        <CardContent className=\"p-4\">
          <div className=\"grid grid-cols-2 gap-2\">
            <Button
              onClick={() => sendStatusUpdate('active')}
              className=\"bg-green-600 hover:bg-green-700 text-white\"
              size=\"sm\"
              disabled={connectionStatus !== 'connected'}
            >
              <i className=\"fas fa-play mr-2\"></i>
              Active
            </Button>
            
            <Button
              onClick={() => sendStatusUpdate('idle')}
              className=\"bg-yellow-600 hover:bg-yellow-700 text-white\"
              size=\"sm\"
              disabled={connectionStatus !== 'connected'}
            >
              <i className=\"fas fa-pause mr-2\"></i>
              Idle
            </Button>
            
            <Button
              onClick={() => sendStatusUpdate('maintenance')}
              className=\"bg-purple-600 hover:bg-purple-700 text-white\"
              size=\"sm\"
              disabled={connectionStatus !== 'connected'}
            >
              <i className=\"fas fa-tools mr-2\"></i>
              Service
            </Button>
            
            <Button
              onClick={() => sendStatusUpdate('offline')}
              className=\"bg-red-600 hover:bg-red-700 text-white\"
              size=\"sm\"
              disabled={connectionStatus !== 'connected'}
            >
              <i className=\"fas fa-stop mr-2\"></i>
              Offline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <Card>
        <CardHeader>
          <CardTitle className=\"text-lg text-red-600\">
            <i className=\"fas fa-exclamation-triangle mr-2\"></i>
            Emergency
          </CardTitle>
        </CardHeader>
        <CardContent className=\"p-4\">
          <Button
            className=\"w-full bg-red-600 hover:bg-red-700 text-white\"
            onClick={() => {
              sendStatusUpdate('emergency');
              toast.error('Emergency alert sent to fleet manager!');
            }}
            disabled={connectionStatus !== 'connected'}
          >
            <i className=\"fas fa-exclamation-circle mr-2\"></i>
            Send Emergency Alert
          </Button>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardContent className=\"p-4 text-center text-sm text-gray-600\">
          <p className=\"mb-2\">
            <i className=\"fas fa-info-circle mr-2\"></i>
            Keep this app open for continuous tracking
          </p>
          <p>
            For technical support, contact your fleet manager
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDriverInterface;"