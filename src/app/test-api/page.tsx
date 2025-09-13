'use client';

import { useEffect, useState } from 'react';

export default function ApiTestPage() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const testGooglePlacesAPI = () => {
      const googleWindow = window as unknown as { 
        google?: { 
          maps?: { 
            places?: {
              AutocompleteService: new () => {
                getPlacePredictions: (request: unknown, callback: (predictions: unknown[], status: string) => void) => void;
              };
              PlacesServiceStatus: {
                OK: string;
              };
            };
          };
        };
      };
      
      if (!googleWindow.google) {
        setApiStatus('❌ Google Maps JavaScript API not loaded');
        return;
      }

      if (!googleWindow.google.maps) {
        setApiStatus('❌ Google Maps not available');
        return;
      }

      if (!googleWindow.google.maps.places) {
        setApiStatus('❌ Google Places API not available');
        return;
      }

      setApiStatus('✅ Google Places API loaded successfully');

      // Test autocomplete service
      try {
        const service = new googleWindow.google.maps.places.AutocompleteService();
        
        // Test with "chittoor"
        service.getPlacePredictions(
          {
            input: 'chittoor',
            types: ['geocode']
          },
          (predictions: unknown[], status: string) => {
            if (status === googleWindow.google?.maps?.places?.PlacesServiceStatus.OK) {
              setTestResults(prev => [...prev, `✅ Found ${predictions.length} results for "chittoor"`]);
              const predictionArray = predictions as Array<{ description: string }>;
              predictionArray.slice(0, 3).forEach((prediction) => {
                setTestResults(prev => [...prev, `   - ${prediction.description}`]);
              });
            } else {
              setTestResults(prev => [...prev, `❌ Error searching for "chittoor": ${status}`]);
            }
          }
        );

        // Test with "new york"
        service.getPlacePredictions(
          {
            input: 'new york',
            types: ['geocode']
          },
          (predictions: unknown[], status: string) => {
            if (status === googleWindow.google?.maps?.places?.PlacesServiceStatus.OK) {
              setTestResults(prev => [...prev, `✅ Found ${predictions.length} results for "new york"`]);
            } else {
              setTestResults(prev => [...prev, `❌ Error searching for "new york": ${status}`]);
            }
          }
        );

      } catch (error) {
        setApiStatus('❌ Error creating AutocompleteService: ' + String(error));
      }
    };

    // Wait a bit for the API to load
    const timer = setTimeout(testGooglePlacesAPI, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Google Places API Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">API Status</h2>
          <p className="text-sm font-mono">{apiStatus}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="space-y-1">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">Running tests...</p>
            ) : (
              testResults.map((result, index) => (
                <p key={index} className="text-sm font-mono">{result}</p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}