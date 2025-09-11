// Google Maps Places API Type Declarations

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: unknown;
        Map?: unknown;
        LatLng?: unknown;
        Geocoder?: unknown;
      };
    };
  }
}

export {};
