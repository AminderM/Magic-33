import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">
      <span style="
        transform: rotate(45deg);
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">${label}</span>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Routing control component
const RoutingControl = ({ pickup, destination, stops, onRouteCalculated, calculateTrigger }) => {
  const map = useMap();
  const routingControlRef = useRef(null);
  const lastRouteRef = useRef(null);
  const isCalculatingRef = useRef(false);

  useEffect(() => {
    if (!pickup || !destination || !map) return;

    const routeKey = `${pickup}|${destination}|${(stops || []).join('|')}|${calculateTrigger}`;
    
    // Don't recalculate same route or if already calculating
    if (routeKey === lastRouteRef.current || isCalculatingRef.current) return;
    
    lastRouteRef.current = routeKey;
    isCalculatingRef.current = true;

    // Safely remove existing routing control
    if (routingControlRef.current) {
      try {
        routingControlRef.current.setWaypoints([]);
        map.removeControl(routingControlRef.current);
      } catch (e) {
        // Ignore cleanup errors
      }
      routingControlRef.current = null;
    }

    // Geocode addresses to coordinates
    const geocodeAddress = async (address) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          return L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
        }
        return null;
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    };

    const setupRoute = async () => {
      console.log('OSMMapPreview: Setting up route', { pickup, destination, stops });
      
      // Geocode all addresses
      const pickupCoords = await geocodeAddress(pickup);
      const destCoords = await geocodeAddress(destination);
      
      if (!pickupCoords || !destCoords) {
        toast.error('Could not geocode addresses');
        isCalculatingRef.current = false;
        return;
      }

      // Geocode stops
      const stopCoords = [];
      for (const stop of (stops || [])) {
        const coords = await geocodeAddress(stop);
        if (coords) {
          stopCoords.push(coords);
        }
      }

      // Build waypoints array
      const waypoints = [pickupCoords, ...stopCoords, destCoords];

      // Check if map is still available
      if (!map || !map._container) {
        isCalculatingRef.current = false;
        return;
      }

      // Create routing control
      try {
        const routingControl = L.Routing.control({
          waypoints: waypoints,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving'
          }),
          lineOptions: {
            styles: [{ color: '#F7B501', weight: 5, opacity: 0.8 }],
            extendToWaypoints: true,
            missingRouteTolerance: 0
          },
          show: false,
          addWaypoints: false,
          routeWhileDragging: false,
          fitSelectedRoutes: true,
          showAlternatives: false,
          createMarker: (i, waypoint, n) => {
            const isStart = i === 0;
            const isEnd = i === n - 1;
            const label = isStart ? 'A' : isEnd ? 'B' : String(i);
            const color = isStart ? '#22c55e' : isEnd ? '#ef4444' : '#3b82f6';
            
            return L.marker(waypoint.latLng, {
              icon: createCustomIcon(color, label)
            });
          }
        });

        routingControl.on('routesfound', (e) => {
          const routes = e.routes;
          if (routes && routes.length > 0) {
            const route = routes[0];
            const distanceMiles = (route.summary.totalDistance / 1609.34).toFixed(2);
            const durationHours = (route.summary.totalTime / 3600).toFixed(2);
            
            console.log('OSMMapPreview: Route found', { distanceMiles, durationHours });
            
            if (onRouteCalculated) {
              onRouteCalculated({
                distance: `${distanceMiles} miles`,
                duration: `${durationHours} hours`,
                distanceValue: parseFloat(distanceMiles),
                durationValue: parseFloat(durationHours)
              });
            }
            toast.success(`Route calculated: ${distanceMiles} miles`);
          }
          isCalculatingRef.current = false;
        });

        routingControl.on('routingerror', (e) => {
          console.error('OSMMapPreview: Routing error', e);
          toast.error('Could not calculate route');
          isCalculatingRef.current = false;
        });

        routingControl.addTo(map);
        routingControlRef.current = routingControl;
      } catch (e) {
        console.error('OSMMapPreview: Error creating routing control', e);
        isCalculatingRef.current = false;
      }
    };

    setupRoute();

    // Cleanup function
    return () => {
      if (routingControlRef.current && map) {
        try {
          routingControlRef.current.setWaypoints([]);
          if (map._container) {
            map.removeControl(routingControlRef.current);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        routingControlRef.current = null;
      }
    };
  }, [pickup, destination, stops, calculateTrigger, map, onRouteCalculated]);

  return null;
};

const OSMMapPreview = ({ pickup, destination, stops, onRouteCalculated, calculateTrigger }) => {
  const [mapType, setMapType] = useState('street'); // street or satellite
  const defaultCenter = [39.8283, -98.5795]; // Center of US
  const defaultZoom = 4;

  const tileLayers = {
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-border h-[480px]">
      {/* Map Type Toggle */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
        <Button
          size="sm"
          variant={mapType === 'street' ? 'default' : 'ghost'}
          className="h-7 px-2 text-xs"
          onClick={() => setMapType('street')}
        >
          Map
        </Button>
        <Button
          size="sm"
          variant={mapType === 'satellite' ? 'default' : 'ghost'}
          className="h-7 px-2 text-xs"
          onClick={() => setMapType('satellite')}
        >
          Satellite
        </Button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          key={mapType}
          url={tileLayers[mapType].url}
          attribution={tileLayers[mapType].attribution}
        />
        
        {pickup && destination && (
          <RoutingControl
            pickup={pickup}
            destination={destination}
            stops={stops}
            onRouteCalculated={onRouteCalculated}
            calculateTrigger={calculateTrigger}
          />
        )}
      </MapContainer>

      {/* No route message overlay */}
      {(!pickup || !destination) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none z-[500]">
          <div className="text-center text-muted-foreground">
            <i className="fas fa-map text-6xl mb-3 opacity-50"></i>
            <p className="text-sm font-medium mb-1">No route calculated</p>
            <p className="text-xs">Enter locations below to view route</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OSMMapPreview;
