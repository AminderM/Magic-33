import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const LocationTracking = () => {
  const { user, fetchWithAuth } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      loadLocationHistory();
    }
  }, [selectedEquipment]);

  useEffect(() => {
    let watchId = null;
    
    if (trackingEnabled && selectedEquipment) {
      // Start watching position
      watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trackingEnabled, selectedEquipment]);

  const loadEquipment = async () => {
    try {
      let response;
      if (user?.role === 'fleet_owner') {
        response = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      } else {
        // For drivers, load equipment they're assigned to
        response = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
        if (data.length === 1) {
          setSelectedEquipment(data[0].id);
        }
      }
    } catch (error) {
      toast.error('Error loading equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadLocationHistory = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/locations/${selectedEquipment}`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  };

  const handleLocationUpdate = async (position) => {
    const { latitude, longitude } = position.coords;
    setCurrentLocation({ latitude, longitude, timestamp: new Date() });
    
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/locations`, {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: selectedEquipment,
          latitude,
          longitude
        })
      });

      if (response.ok) {
        // Refresh location history
        loadLocationHistory();
      } else {
        console.error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleLocationError = (error) => {
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
    setTrackingEnabled(false);
  };

  const toggleTracking = () => {
    if (!selectedEquipment) {
      toast.error('Please select equipment first');
      return;
    }
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }
    
    setTrackingEnabled(!trackingEnabled);
    
    if (!trackingEnabled) {
      toast.success('Location tracking started');
    } else {
      toast.info('Location tracking stopped');
      setCurrentLocation(null);
    }
  };

  const getEquipmentName = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : 'Unknown Equipment';
  };

  const formatLocation = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const openInMaps = (lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Location Tracking</h2>
          <p className="text-gray-600">
            {user?.role === 'fleet_owner' 
              ? 'Monitor your equipment locations in real-time'
              : 'Update your current location for fleet tracking'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-48">
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger data-testid="equipment-tracking-select">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={toggleTracking}
            className={trackingEnabled ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'}
            disabled={!selectedEquipment}
            data-testid="toggle-tracking-btn"
          >
            <i className={`fas ${trackingEnabled ? 'fa-stop' : 'fa-play'} mr-2`}></i>
            {trackingEnabled ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-broadcast-tower mr-2 text-blue-600"></i>
            Tracking Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">
                <Badge className={trackingEnabled ? 'status-verified' : 'status-pending'}>
                  <i className={`fas ${trackingEnabled ? 'fa-satellite-dish' : 'fa-pause'} mr-2`}></i>
                  {trackingEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Tracking Status</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 mb-2">
                {selectedEquipment ? getEquipmentName(selectedEquipment) : 'None Selected'}
              </div>
              <p className="text-sm text-gray-600">Selected Equipment</p>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-mono text-gray-700 mb-2">
                {currentLocation 
                  ? formatLocation(currentLocation.latitude, currentLocation.longitude)
                  : 'No location data'}
              </div>
              <p className="text-sm text-gray-600">Current Position</p>
              {currentLocation && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => openInMaps(currentLocation.latitude, currentLocation.longitude)}
                  className="mt-1"
                  data-testid="open-current-location-btn"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  View on Map
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location History */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              <i className="fas fa-history mr-2 text-green-600"></i>
              Location History
            </span>
            {selectedEquipment && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={loadLocationHistory}
                data-testid="refresh-history-btn"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedEquipment ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-3xl mb-4">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <p className="text-gray-600">Select equipment to view location history</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-3xl mb-4">
                <i className="fas fa-route"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Location Data</h3>
              <p className="text-gray-600 mb-4">
                No location history available for this equipment.
              </p>
              {!trackingEnabled && (
                <Button 
                  onClick={toggleTracking}
                  className="btn-primary"
                  data-testid="start-tracking-from-history-btn"
                >
                  <i className="fas fa-play mr-2"></i>
                  Start Tracking
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`location-entry-${index}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-map-marker-alt text-blue-600"></i>
                    </div>
                    <div>
                      <p className="font-mono text-sm text-gray-800">
                        {formatLocation(location.latitude, location.longitude)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(location.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openInMaps(location.latitude, location.longitude)}
                      data-testid={`view-location-btn-${index}`}
                    >
                      <i className="fas fa-external-link-alt mr-1"></i>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-map mr-2 text-purple-600"></i>
            Live Map View
            <Badge className="ml-2 status-pending">
              Coming Soon
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">
              <i className="fas fa-map"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Map Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              We're working on integrating an interactive map to show real-time equipment locations, 
              route history, and geofencing capabilities.
            </p>
            <div className="text-sm text-gray-500">
              <p>Features in development:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Real-time equipment positioning</li>
                <li>Route tracking and history</li>
                <li>Geofencing alerts</li>
                <li>Multi-equipment view</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationTracking;