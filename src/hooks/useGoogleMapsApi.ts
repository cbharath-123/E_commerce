import { useState, useEffect } from 'react';

export const useGoogleMapsApi = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkGoogleMaps = () => {
      const googleWindow = window as unknown as { google?: { maps?: { places?: unknown } } };
      if (googleWindow.google?.maps?.places) {
        setIsLoaded(true);
        return;
      }

      // If not loaded, keep checking
      const interval = setInterval(() => {
        const googleWindow = window as unknown as { google?: { maps?: { places?: unknown } } };
        if (googleWindow.google?.maps?.places) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      }, 100);

      // Stop checking after 10 seconds and set error
      const timeout = setTimeout(() => {
        const googleWindow = window as unknown as { google?: { maps?: { places?: unknown } } };
        if (!googleWindow.google?.maps?.places) {
          setError('Google Maps API failed to load');
          clearInterval(interval);
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    };

    checkGoogleMaps();
  }, []);

  return { isLoaded, error };
};
