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
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey || !window.google || !window.google.maps) {
      console.log('PlacesAutocomplete: Google Maps not ready yet');
      return;
    }

    // Check if Places library is loaded
    if (!window.google.maps.places) {
      console.error('PlacesAutocomplete: Places library not loaded');
      return;
    }

    setIsLoaded(true);

    // Initialize autocomplete
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'us' }, // Restrict to US, you can remove this line for worldwide
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

      autocompleteRef.current = autocomplete;
      console.log('PlacesAutocomplete: Initialized successfully');
    } catch (error) {
      console.error('PlacesAutocomplete: Error initializing:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
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
      placeholder={placeholder}
      className={className}
    />
  );
};

export default PlacesAutocomplete;
