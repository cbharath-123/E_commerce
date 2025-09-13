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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<{ getPlacePredictions: (request: unknown, callback: (predictions: unknown, status: unknown) => void) => void } | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load saved location from localStorage on component mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setLocation(savedLocation);
    }
  }, []);

  // Initialize Google Places Autocomplete Service
  useEffect(() => {
    const initializeGooglePlaces = () => {
      const googleWindow = window as unknown as { google?: { maps?: { places?: { AutocompleteService: new () => unknown } } } };
      if (googleWindow.google?.maps?.places) {
        try {
          autocompleteService.current = new googleWindow.google.maps.places.AutocompleteService() as { getPlacePredictions: (request: unknown, callback: (predictions: unknown, status: unknown) => void) => void };
          setApiError(null);
          console.log('Google Places API initialized successfully');
        } catch (error) {
          console.error('Error initializing Google Places API:', error);
          setApiError('Failed to initialize location services');
        }
      }
    };

    // Check if Google Maps API is already loaded
    const googleWindow = window as unknown as { google?: unknown };
    if (googleWindow.google) {
      initializeGooglePlaces();
    } else {
      // Wait for Google Maps API to load
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds with 100ms intervals
      
      const checkGoogle = setInterval(() => {
        attempts++;
        const googleWindow = window as unknown as { google?: { maps?: { places?: unknown } } };
        if (googleWindow.google?.maps?.places) {
          initializeGooglePlaces();
          clearInterval(checkGoogle);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkGoogle);
          setApiError('Google Places API failed to load. Please check your API key.');
          console.error('Google Places API timeout');
        }
      }, 100);

      // Cleanup function
      return () => {
        clearInterval(checkGoogle);
      };
    }
  }, []);

  // Cleanup function to clear debounce timer
  useEffect(() => {
    const currentTimer = debounceTimer.current;
    return () => {
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
    };
  }, []);

  // Debounced function to get place predictions
  const getPlacePredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const request = {
      input: input.trim(),
      types: ['geocode'],
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions: unknown, status: unknown) => {
        setIsLoading(false);
        const googleWindow = window as unknown as { google?: { maps?: { places?: { PlacesServiceStatus: { OK: unknown, ZERO_RESULTS: unknown, REQUEST_DENIED: unknown, INVALID_REQUEST: unknown } } } } };
        
        if (status === googleWindow.google?.maps?.places?.PlacesServiceStatus.OK && predictions) {
          const predictionArray = predictions as Array<{
            description: string;
            place_id: string;
            structured_formatting: {
              main_text: string;
              secondary_text?: string;
            };
          }>;
          
          const formattedSuggestions = predictionArray.map((prediction) => ({
            description: prediction.description,
            place_id: prediction.place_id,
            structured_formatting: {
              main_text: prediction.structured_formatting.main_text,
              secondary_text: prediction.structured_formatting.secondary_text || '',
            },
          }));
          
          setSuggestions(formattedSuggestions);
          setIsOpen(formattedSuggestions.length > 0);
          setActiveIndex(-1);
          
          // Ensure input stays focused after suggestions load
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 0);
          
        } else if (status === googleWindow.google?.maps?.places?.PlacesServiceStatus.ZERO_RESULTS) {
          setSuggestions([]);
          setIsOpen(false);
        } else if (status === googleWindow.google?.maps?.places?.PlacesServiceStatus.REQUEST_DENIED) {
          setSuggestions([]);
          setIsOpen(false);
          setApiError('API key invalid or Places API not enabled');
          console.error('Places API request denied - check API key and billing');
        } else {
          setSuggestions([]);
          setIsOpen(false);
          console.error('Places API error:', status);
        }
      }
    );
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    // Save to localStorage
    if (value.trim()) {
      localStorage.setItem('userLocation', value);
    } else {
      localStorage.removeItem('userLocation');
    }
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Reset active index when typing
    setActiveIndex(-1);

    // Close suggestions while typing - only show when user presses Enter
    setIsOpen(false);
    setSuggestions([]);
    setIsLoading(false);
  };

  const selectSuggestion = (suggestion: PlacePrediction) => {
    setLocation(suggestion.description);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    
    // Save selected location to localStorage
    localStorage.setItem('userLocation', suggestion.description);
    
    // Keep input focused after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
    
    console.log('Selected location:', {
      description: suggestion.description,
      place_id: suggestion.place_id,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If suggestions are open and there's an active selection
      if (isOpen && suggestions.length > 0 && activeIndex >= 0) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        // Trigger search if there's text in the input
        if (location.trim().length >= 2) {
          setIsLoading(true);
          setIsOpen(true);
          getPlacePredictions(location.trim());
        }
      }
      return;
    }

    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
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
                const currentLocation = resultArray[0].formatted_address;
                setLocation(currentLocation);
                // Save current location to localStorage
                localStorage.setItem('userLocation', currentLocation);
                console.log('Current location detected:', currentLocation);
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
          ref={inputRef}
          type="text"
          value={location}
          onChange={handleLocationChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter location"
          className="flex-1 outline-none text-sm bg-transparent text-gray-900 placeholder-gray-400 font-medium"
          disabled={isLoading}
          autoComplete="off"
          aria-autocomplete="list"
        />
        {isLoading && (
          <div className="flex-shrink-0">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul 
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent focus loss from input
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              role="option"
              aria-selected={index === activeIndex}
              className={`w-full px-4 py-3 text-left transition-colors text-sm border-b border-gray-100 last:border-b-0 cursor-pointer ${
                index === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-100'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input from losing focus
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
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
            </li>
          ))}
        </ul>
      )}

      {/* No API Key Warning / Error States */}
      {apiError && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 z-50">
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            {apiError}
          </div>
        </div>
      )}
      
      {!apiError && typeof window !== 'undefined' && !((window as unknown as { google?: unknown }).google) && !isLoading && (
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
