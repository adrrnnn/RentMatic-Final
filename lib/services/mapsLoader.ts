let mapsApiLoading: Promise<void> | null = null;

export function loadGoogleMapsApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as Window & { google?: { maps?: unknown }; initMap?: () => void };
  if (w.google && w.google.maps) return Promise.resolve();
  if (mapsApiLoading) return mapsApiLoading;

  // Prefer runtime public env if available (e.g., public/env.js on Hosting)
  const runtimeEnv = (window as unknown as { env?: Record<string, string> }).env || {};
  const apiKey = runtimeEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const scriptId = 'google-maps-js';
  type GoogleWindow = Window & { google?: { maps?: { importLibrary?: (lib: string) => Promise<unknown> } } };
  const ensureLibraries = async () => {
    const g = (window as GoogleWindow).google;
    if (!g?.maps) return;
    const importer = g.maps.importLibrary?.bind(g.maps);
    try {
      if (importer) {
        await importer('maps');
        await importer('places');
      }
    } catch { /* noop */ }
  };

  if (document.getElementById(scriptId)) {
    mapsApiLoading = new Promise((resolve) => {
      const check = async () => {
        const gmaps = (window as unknown as { google?: { maps?: unknown } }).google?.maps;
        if (gmaps) { await ensureLibraries(); resolve(); }
        else setTimeout(check, 50);
      };
      check();
    });
    return mapsApiLoading;
  }

  mapsApiLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    const libs = 'places';
    // Use loading=async and avoid callback to match current best practices and remove warnings
    const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey || ''}&libraries=${libs}&loading=async&v=weekly`;
    script.src = src;
    script.onload = async () => {
      const gmaps = (window as unknown as { google?: { maps?: unknown } }).google?.maps;
      if (gmaps) { await ensureLibraries(); resolve(); }
      else reject(new Error('Google Maps loaded but google.maps is undefined'));
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return mapsApiLoading;
}


