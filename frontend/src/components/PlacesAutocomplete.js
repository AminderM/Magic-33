import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

const PlacesAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  apiKey,
  className = "",
  onKeyDown
}) => {
  const inputRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey || !window.google || !window.google.maps) {
      console.log('PlacesAutocomplete: Google Maps not ready yet');
      return;
    }

    // Wait for Places library to load with retry mechanism
    const initPlaces = async () => {
      if (!window.google.maps.places) {
        console.log('PlacesAutocomplete: Waiting for Places library...');
        setTimeout(initPlaces, 100);
        return;
      }
      
      console.log('PlacesAutocomplete: Places library loaded successfully');
      
      try {
        // Import the new Places library
        const { AutocompleteService, AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
        
        // Create a new session token
        sessionTokenRef.current = new AutocompleteSessionToken();
        
        setIsLoaded(true);
        console.log('PlacesAutocomplete: New Places API initialized successfully');
      } catch (error) {
        console.error('PlacesAutocomplete: Error loading new Places API:', error);
        // Fallback: try using the old API if new one fails
        initLegacyPlaces();
      }
    };
    
    // Fallback to legacy API if needed
    const initLegacyPlaces = () => {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          fields: ['formatted_address', 'geometry', 'name']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (place.formatted_address) {
            onChange(place.formatted_address);
          } else if (place.name) {
            onChange(place.name);
          }
        });

        setIsLoaded(true);
        console.log('PlacesAutocomplete: Legacy API initialized successfully');
      } catch (error) {
        console.error('PlacesAutocomplete: Error initializing legacy API:', error);
      }
    };
    
    initPlaces();

    return () => {
      // Cleanup if needed
    };
  }, [apiKey, onChange]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default PlacesAutocomplete;
