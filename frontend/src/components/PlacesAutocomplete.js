import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

const PlacesAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  apiKey,
  className = "",
  onKeyDown,
  onBlur
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Add CSS to control pac-container z-index
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pac-container {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!apiKey || !window.google || !window.google.maps) {
      console.log('PlacesAutocomplete: Google Maps not ready yet');
      return;
    }

    // Wait for Places library to load with retry mechanism
    const initPlaces = () => {
      if (!window.google.maps.places) {
        console.log('PlacesAutocomplete: Waiting for Places library...');
        setTimeout(initPlaces, 100);
        return;
      }
      
      console.log('PlacesAutocomplete: Places library loaded successfully');
      setIsLoaded(true);

      // Initialize autocomplete after library is loaded
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          // Support all countries including Canada, US, and worldwide locations
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
    };
    
    initPlaces();

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [apiKey, onChange]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleBlur = (e) => {
    // Hide autocomplete dropdown on blur after a short delay
    // This allows clicking on autocomplete suggestions to work
    setTimeout(() => {
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        container.style.display = 'none';
      });
    }, 200);
    
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default PlacesAutocomplete;
