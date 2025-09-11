'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

export default function LocationInput() {
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteService = useRef<{ getPlacePredictions: (request: unknown, callback: (predictions: unknown, status: unknown) => void) => void } | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places Autocomplete Service
  useEffect(() => {
    const initializeGooglePlaces = () => {
      const googleWindow = window as unknown as { google?: { maps?: { places?: { AutocompleteService: new () => unknown } } } };
      if (googleWindow.google?.maps?.places) {
        autocompleteService.current = new googleWindow.google.maps.places.AutocompleteService() as { getPlacePredictions: (request: unknown, callback: (predictions: unknown, status: unknown) => void) => void };
      }
    };

    // Check if Google Maps API is already loaded
    const googleWindow = window as unknown as { google?: unknown };
    if (googleWindow.google) {
      initializeGooglePlaces();
    } else {
      // Wait for Google Maps API to load
      const checkGoogle = setInterval(() => {
        const googleWindow = window as unknown as { google?: { maps?: { places?: unknown } } };
        if (googleWindow.google?.maps?.places) {
          initializeGooglePlaces();
          clearInterval(checkGoogle);
        }
      }, 100);

      // Clear interval after 10 seconds to avoid infinite loop
      setTimeout(() => {
        clearInterval(checkGoogle);
      }, 10000);
    }
  }, []);

  // Debounced function to get place predictions
  const getPlacePredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const request = {
      input,
      types: ['(cities)'], // Focus on cities, but you can change this to ['geocode'] for all locations
      componentRestrictions: { country: ['us', 'ca', 'gb', 'au'] }, // You can customize this
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions: unknown, status: unknown) => {
        setIsLoading(false);
        const googleWindow = window as unknown as { google?: { maps?: { places?: { PlacesServiceStatus: { OK: unknown } } } } };
        if (status === googleWindow.google?.maps?.places?.PlacesServiceStatus.OK && predictions) {
          const predictionArray = predictions as Array<{
            description: string;
            place_id: string;
            structured_formatting: {
              main_text: string;
              secondary_text: string;
            };
          }>;
          setSuggestions(
            predictionArray.map((prediction) => ({
              description: prediction.description,
              place_id: prediction.place_id,
              structured_formatting: {
                main_text: prediction.structured_formatting.main_text,
                secondary_text: prediction.structured_formatting.secondary_text,
              },
            }))
          );
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set loading state if there's input
    if (value.length >= 2) {
      setIsLoading(true);
    }

    // Debounce the API call
    debounceTimer.current = setTimeout(() => {
      getPlacePredictions(value);
    }, 300);
  };

  const handleLocationSelect = (selectedLocation: PlacePrediction) => {
    setLocation(selectedLocation.description);
    setIsOpen(false);
    setSuggestions([]);
    
    // You can store the place_id for more detailed information if needed
    console.log('Selected location:', {
      description: selectedLocation.description,
      place_id: selectedLocation.place_id,
    });
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (location.length >= 2) {
      getPlacePredictions(location);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click events on suggestions
    setTimeout(() => setIsOpen(false), 200);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address
          const googleWindow = window as unknown as { 
            google?: { 
              maps?: { 
                Geocoder: new () => { geocode: (request: unknown, callback: (results: unknown, status: unknown) => void) => void };
                LatLng: new (lat: number, lng: number) => unknown;
              } 
            } 
          };
          if (googleWindow.google?.maps) {
            const geocoder = new googleWindow.google.maps.Geocoder();
            const latlng = new googleWindow.google.maps.LatLng(latitude, longitude);
            
            geocoder.geocode({ location: latlng }, (results: unknown, status: unknown) => {
              setIsLoading(false);
              const resultArray = results as Array<{ formatted_address: string }>;
              if (status === 'OK' && resultArray && resultArray[0]) {
                setLocation(resultArray[0].formatted_address);
              } else {
                console.error('Geocoding failed:', status);
              }
            });
          }
        },
        (error) => {
          setIsLoading(false);
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors cursor-pointer min-w-[200px]">
        <button
          onClick={getCurrentLocation}
          className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
          title="Use current location"
          disabled={isLoading}
        >
          <MapPin 
            size={16} 
            className={`text-gray-500 ${isLoading ? 'animate-pulse' : ''}`} 
          />
        </button>
        <input
          type="text"
          value={location}
          onChange={handleLocationChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Enter location"
          className="flex-1 outline-none text-sm bg-transparent"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="flex-shrink-0">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Searching locations...
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                onMouseDown={() => handleLocationSelect(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    {suggestion.structured_formatting.secondary_text && (
                      <div className="text-xs text-gray-500 mt-1">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* No API Key Warning */}
      {typeof window !== 'undefined' && !((window as unknown as { google?: unknown }).google) && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 z-50">
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            Google Places API is loading...
          </div>
        </div>
      )}
    </div>
  );
}
