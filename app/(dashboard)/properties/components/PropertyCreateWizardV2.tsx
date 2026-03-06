/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, ChevronLeft, ChevronRight, Building2, FileText, Home, User, Tag } from "lucide-react";
import { Button } from "@/components/Button";
import type { CreatePropertyData } from "@/types/firestore";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
const phLocations = require('ph-locations');

type Step = 1 | 2 | 3 | 4 | 5;

interface PropertyCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreatePropertyData) => Promise<void>;
}

export function PropertyCreateWizardV2({ isOpen, onClose, onCreate }: PropertyCreateWizardProps) {
  // Initialize with actual window dimensions to avoid SSR hydration mismatch
  const [windowHeight, setWindowHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerHeight;
    return 900;
  });
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 1440;
  });
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);

  // Track window dimensions for responsive modal sizing
  useEffect(() => {
    const updateDimensions = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Form state
  const [form, setForm] = useState<CreatePropertyData>(() => ({
    name: "",
    address: "",
    type: "Apartment",
    numberOfUnits: 0,
    description: "",
    imageURL: "",
    manager: "",
    addressPH: {},
    association: {},
    compliance: {},
    management: {},
    payments: { wallets: [], banks: [], currency: "PHP" },
    billingDefaults: { dueDay: 1, graceDays: 0, lateFeeType: "flat", lateFeeValue: 0, reminderDaysBefore: [3, 1] },
    amenities: [],
    policies: {},
    tags: []
  }));

  const canNext = useMemo(() => {
    if (step === 1) return !!form.name && !!form.address;
    if (step === 2) return !!form.type;
    return true;
  }, [step, form]);

  // PH location cascading data (from ph-locations npm package)
  const provinces = useMemo(() => {
    try {
      return phLocations.provinces.map((p: any) => p.name);
    } catch {
      return [];
    }
  }, []);

  const cities = useMemo(() => {
    const province = form.addressPH?.province;
    if (!province) return [];
    try {
      const prov = phLocations.provinces.find((p: any) => p.name === province);
      if (!prov) return [];
      return phLocations.citiesMunicipalities.filter((c: any) => c.province === prov.code).map((c: any) => c.name);
    } catch {
      return [];
    }
  }, [form.addressPH?.province]);

  // Geocode address to lat/lng when province or city changes
  useEffect(() => {
    const geocode = async () => {
      if (!form.addressPH?.province || !form.addressPH?.city) return;
      if (!mapInstanceRef.current || !markerRef.current) return;
      const key = (window as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_MAPTILER_KEY;
      if (!key) return;

      try {
        const query = `${form.addressPH.city}, ${form.addressPH.province}, Philippines`;
        const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${key}&limit=1`);
        if (!res.ok) return;
        const data = await res.json();
        const coords = data?.features?.[0]?.geometry?.coordinates;
        if (coords && coords.length === 2) {
          const [lng, lat] = coords;
          mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1500 });
          markerRef.current.setLngLat([lng, lat]);
          setForm(prev => ({ ...prev, addressPH: { ...prev.addressPH, lat, lng } }));
        }
      } catch { /* noop */ }
    };
    geocode();
  }, [form.addressPH?.province, form.addressPH?.city]);

  // Initialize MapLibre map
  useEffect(() => {
    if (!isOpen || step !== 1 || !mapRef.current || mapInstanceRef.current) return;

    const center = { lng: 120.9842, lat: 14.5995 };
    const runtimeEnv = (window as unknown as { env?: Record<string, string> }).env || {};
    const key = runtimeEnv.NEXT_PUBLIC_MAPTILER_KEY || '';
    const styleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom: 14
    });

    map.on('styleimagemissing', (e) => {
      const id = (e as any).id;
      if (!id || map.hasImage(id)) return;
      const empty = new Uint8Array([0, 0, 0, 0]);
      try { map.addImage(id, { width: 1, height: 1, data: empty }); } catch { /* noop */ }
    });

    mapInstanceRef.current = map;

    const marker = new maplibregl.Marker({ draggable: true, color: '#16a34a' })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    markerRef.current = marker;

    marker.on('dragend', async () => {
      const pos = marker.getLngLat();
      
      // Get detailed reverse geocode data to extract province and city reliably
      const key = (window as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_MAPTILER_KEY;
      if (!key) return;
      
      try {
        const res = await fetch(`https://api.maptiler.com/geocoding/${pos.lng},${pos.lat}.json?key=${key}`);
        if (!res.ok) return;
        const data = await res.json();
        console.log('Reverse geocode result:', data);
        const feature = data?.features?.[0];
        if (!feature) return;
        
        const address = feature.place_name || '';
        const context = feature.context || [];
        const properties = feature.properties || {};

        console.log('Feature context:', context);
        console.log('Feature properties:', properties);
        console.log('Full address:', address);

        // Prefer MapTiler context for province/city, then fallback to address parts
        const addressParts = address.split(',').map((s: string) => s.trim());
        console.log('Address parts:', addressParts);

        let matchedProvince = '';
        let matchedCity = '';

        const getCtxText = (prefixes: string[]): string => {
          const entry = context.find((ctx: any) => {
            const id: string = ctx?.id || '';
            return prefixes.some((p) => id.startsWith(p));
          });
          return (entry?.text as string) || '';
        };

        // Extract region and place/locality from context
        const regionText = getCtxText(['region.', 'macroregion.', 'district.']);
        const placeText = getCtxText(['place.', 'locality.', 'city.']);
        console.log('Context-derived regionText:', regionText, 'placeText:', placeText);

        const normalize = (s: string) => s.replace(/province/gi, '').trim();

        // NCR / Metro Manila normalization
        const ncrSynonyms = ['Metro Manila', 'National Capital Region', 'NCR'];
        const tryMatchProvince = (candidate: string): string => {
          if (!candidate) return '';
          const norm = normalize(candidate).toLowerCase();
          // Try direct match
          const direct = provinces.find((p: string) => p.toLowerCase() === norm);
          if (direct) return direct;
          // Try includes either side
          const includes = provinces.find((p: string) => p.toLowerCase().includes(norm) || norm.includes(p.toLowerCase()));
          if (includes) return includes;
          // Try NCR synonyms mapping to a province entry that contains 'metro manila' or 'ncr'
          if (ncrSynonyms.some((s) => norm.includes(s.toLowerCase()))) {
            const ncr = provinces.find((p: string) => p.toLowerCase().includes('metro manila') || p.toLowerCase().includes('ncr'));
            if (ncr) return ncr;
          }
          return '';
        };

        // 1) Use context first
        if (!matchedProvince) {
          matchedProvince = tryMatchProvince(regionText);
        }
        if (matchedProvince && !matchedCity) {
          const prov = phLocations.provinces.find((pr: any) => pr.name.toLowerCase() === matchedProvince.toLowerCase());
          if (prov) {
            const availableCities = phLocations.citiesMunicipalities
              .filter((c: any) => c.province === prov.code)
              .map((c: any) => c.name);
            const fromContext = availableCities.find((c: string) => c.toLowerCase() === placeText.toLowerCase() || placeText.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(placeText.toLowerCase()));
            if (fromContext) matchedCity = fromContext;
          }
        }

        // 2) Fallback to address parts for province
        if (!matchedProvince) {
          for (const part of addressParts) {
            const found = tryMatchProvince(part);
            if (found) {
              matchedProvince = found;
              break;
            }
          }
        }

        // 3) If province known, fallback to address parts for city
        if (matchedProvince && !matchedCity) {
          const prov = phLocations.provinces.find((pr: any) => pr.name.toLowerCase() === matchedProvince.toLowerCase());
          if (prov) {
            const availableCities = phLocations.citiesMunicipalities
              .filter((c: any) => c.province === prov.code)
              .map((c: any) => c.name);
            for (const part of addressParts) {
              const found = availableCities.find((c: string) => 
                part.toLowerCase() === c.toLowerCase() || 
                part.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(part.toLowerCase())
              );
              if (found) {
                matchedCity = found;
                break;
              }
            }
          }
        }
        
        const updatedPH: any = { ...form.addressPH, lat: pos.lat, lng: pos.lng };
        if (matchedProvince) updatedPH.province = matchedProvince;
        if (matchedCity) updatedPH.city = matchedCity;
        
        console.log('Updated address fields:', { address, province: matchedProvince, city: matchedCity });
        
        setForm(prev => ({
          ...prev,
          address,
          addressPH: updatedPH
        }));
      } catch (err) {
        console.error('Reverse geocode error:', err);
        // Fallback: just update lat/lng
        setForm(prev => ({
          ...prev,
          addressPH: { ...prev.addressPH, lat: pos.lat, lng: pos.lng }
        }));
      }
    });

    return () => {
      marker.remove();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, step]);

  const reverseGeocode = async (lng: number, lat: number): Promise<string | null> => {
    const key = (window as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_MAPTILER_KEY;
    if (!key) return null;
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${key}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.features?.[0]?.place_name || null;
    } catch {
      return null;
    }
  };

  const locateMe = () => {
    if (!mapInstanceRef.current || !markerRef.current || !navigator.geolocation) return;
    setLocating(true);
    setAccuracyMeters(null);

    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    let stopped = false;

    const stop = () => {
      if (stopped) return;
      stopped = true;
      navigator.geolocation.clearWatch(watchId);
      setLocating(false);
    };

    const watchId = navigator.geolocation.watchPosition(async (pos) => {
      if (stopped) return;
      const { latitude, longitude, accuracy } = pos.coords;
      setAccuracyMeters(accuracy ?? null);
      map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), 16), duration: 600 });
      marker.setLngLat([longitude, latitude]);
      if (accuracy !== null && accuracy <= 50) {
        const addr = await reverseGeocode(longitude, latitude);
        setForm(prev => ({
          ...prev,
          address: addr ?? prev.address,
          addressPH: { ...prev.addressPH, lat: latitude, lng: longitude }
        }));
        stop();
      }
    }, () => stop(), { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });

    setTimeout(() => stop(), 10000);
  };

  const closeAndReset = () => {
    setStep(1);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onCreate({ ...form, numberOfUnits: 0 });
      closeAndReset();
    } catch {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getModalMaxWidth = () => {
    if (!windowWidth) return '90vw';
    // Mobile first: < 768px
    if (windowWidth < 768) return `calc(100vw - 32px)`;
    // Tablet: 768-1024px
    if (windowWidth < 1024) return `90vw`;
    // Small Desktop: 1024-1440px
    if (windowWidth < 1440) return `min(85vw, 900px)`;
    // Large Desktop: 1440-1920px
    if (windowWidth < 1920) return `min(80vw, 1000px)`;
    // Ultra-wide: 1920px+
    return `min(75vw, 1200px)`;
  };

  useEffect(() => {
    console.log('Modal dimensions:', { windowWidth, windowHeight, modalMaxWidth: getModalMaxWidth() });
  }, [windowWidth, windowHeight]);

  const modalMaxHeight = windowHeight ? Math.min(windowHeight - 48, 850) : undefined;
  const contentMaxHeight = modalMaxHeight ? Math.max(0, modalMaxHeight - 240) : undefined;
  const modalMaxWidth = getModalMaxWidth();

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center overflow-y-auto px-3 py-6" style={{ minHeight: windowHeight || undefined }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxWidth: modalMaxWidth, maxHeight: modalMaxHeight ? `${modalMaxHeight}px` : undefined }}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0 sticky top-0 z-10 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Property</h2>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Numbered circles + green progress bar */}
        <div className="px-8 py-6 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((s, idx) => (
              <div key={s} className="flex items-center flex-1">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: s === step ? 1.1 : 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all ${
                    s < step ? 'bg-green-600 text-white' :
                    s === step ? 'bg-green-500 text-white ring-4 ring-green-200' :
                    'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </motion.div>
                {idx < 4 && (
                  <div className="h-1 flex-1 mx-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: s < step ? '100%' : '0%' }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      className="h-full bg-green-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto" style={{ maxHeight: contentMaxHeight ? `${contentMaxHeight}px` : undefined, flex: '1 1 0' }}>
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Building2 className="w-4 h-4 text-green-600" />
                    Property Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="e.g., Sunshine Tower Residences"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Full Address *
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="Complete address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Province *</label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.addressPH?.province || ""}
                      onChange={(e) => setForm({ ...form, addressPH: { province: e.target.value, city: '' } })}
                    >
                      <option value="">Select Province</option>
                      {provinces.map((p: string) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">City/Municipality *</label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                      value={form.addressPH?.city || ""}
                      onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, city: e.target.value } })}
                      disabled={!form.addressPH?.province}
                    >
                      <option value="">Select City/Municipality</option>
                      {cities.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Barangay</label>
                    <input
                      placeholder="Enter barangay"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.addressPH?.barangay || ""}
                      onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, barangay: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Subdivision/Condo</label>
                    <input
                      placeholder="Optional"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.addressPH?.subdivision || ""}
                      onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, subdivision: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Street</label>
                    <input
                      placeholder="Optional"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.addressPH?.street || ""}
                      onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, street: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">ZIP Code</label>
                    <input
                      placeholder="Optional"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.addressPH?.zip || ""}
                      onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, zip: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3 h-[520px] rounded-2xl border-2 border-gray-200 overflow-hidden relative shadow-lg">
                <div ref={mapRef} className="w-full h-full" />
                <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg text-xs shadow-lg flex items-center gap-2 border border-gray-200">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Drag the marker to adjust location</span>
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={locateMe}
                    disabled={locating}
                    className="bg-white shadow-lg border-2 border-gray-200 hover:border-green-500"
                  >
                    {locating ? 'Locating...' : 'Locate me'}
                  </Button>
                  {accuracyMeters !== null && (
                    <div className="bg-white px-3 py-1.5 rounded-lg text-xs shadow-lg border border-gray-200">
                      Accuracy: ~{Math.round(accuracyMeters)}m
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-bold text-gray-800">Property Type *</label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option>Apartment</option>
                      <option>Boarding House</option>
                      <option>Condominium</option>
                      <option>Single-detached</option>
                      <option>Townhouse</option>
                      <option>Commercial</option>
                      <option>Mixed-use</option>
                      <option>Other</option>
                    </select>
                    {form.type === 'Other' && (
                      <input
                        placeholder="Specify property type"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mt-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        onChange={(ev) => setForm({ ...form, tags: [...(form.tags || []), ev.target.value] })}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-bold text-gray-800">Association / Condo Corp</label>
                    <input
                      placeholder="e.g., Makati Condominium Corp. (optional)"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.association?.name || ""}
                      onChange={(e) => setForm({ ...form, association: { ...form.association, name: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-bold text-gray-800">Property Manager / Caretaker</label>
                    <input
                      placeholder="Manager name (optional)"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={form.management?.managerName || ""}
                      onChange={(e) => setForm({ ...form, management: { ...form.management, managerName: e.target.value } })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        placeholder="Email (optional)"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        value={form.management?.email || ""}
                        onChange={(e) => setForm({ ...form, management: { ...form.management, email: e.target.value } })}
                      />
                      <input
                        placeholder="Phone +63... (optional)"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        value={form.management?.phone || ""}
                        onChange={(e) => setForm({ ...form, management: { ...form.management, phone: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-bold text-gray-800">Amenities & Policies</label>
                    
                    {/* Amenities Dropdown */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Amenities</label>
                      <select
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        onChange={(e) => {
                          if (e.target.value && !form.amenities?.includes(e.target.value)) {
                            setForm({ ...form, amenities: [...(form.amenities || []), e.target.value] });
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Select amenity to add...</option>
                        <option value="wifi">WiFi</option>
                        <option value="parking">Parking</option>
                        <option value="air-conditioning">Air Conditioning</option>
                        <option value="elevator">Elevator</option>
                        <option value="security">24/7 Security</option>
                        <option value="gym">Gym/Fitness Center</option>
                        <option value="pool">Swimming Pool</option>
                        <option value="laundry">Laundry Facilities</option>
                        <option value="balcony">Balcony</option>
                        <option value="garden">Garden</option>
                        <option value="custom">Add Custom...</option>
                      </select>
                      {form.amenities && form.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.amenities.map((amenity, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              {amenity}
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, amenities: form.amenities?.filter((_, i) => i !== index) })}
                                className="ml-2 text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pet Policy */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Pet Policy</label>
                      <select
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        value={form.policies?.pets || ""}
                        onChange={(e) => setForm({ ...form, policies: { ...form.policies, pets: e.target.value } })}
                      >
                        <option value="">Select pet policy...</option>
                        <option value="pets-allowed">Pets Allowed</option>
                        <option value="no-pets">No Pets</option>
                        <option value="small-pets-only">Small Pets Only</option>
                        <option value="cats-only">Cats Only</option>
                        <option value="dogs-only">Dogs Only</option>
                        <option value="custom">Custom Policy...</option>
                      </select>
                    </div>

                    {/* Smoking Policy */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Smoking Policy</label>
                      <select
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        value={form.policies?.smoking || ""}
                        onChange={(e) => setForm({ ...form, policies: { ...form.policies, smoking: e.target.value } })}
                      >
                        <option value="">Select smoking policy...</option>
                        <option value="no-smoking">No Smoking</option>
                        <option value="smoking-allowed">Smoking Allowed</option>
                        <option value="designated-areas">Designated Areas Only</option>
                        <option value="balcony-only">Balcony Only</option>
                        <option value="custom">Custom Policy...</option>
                      </select>
                    </div>

                    <textarea
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 h-24 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                      placeholder="Internal notes for staff/caretaker (optional)"
                      value={form.manager || ''}
                      onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Tag className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <label className="text-sm font-bold text-gray-800">Description & Tags</label>
                    <textarea
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 h-32 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the property: highlights, nearby landmarks, target tenants..."
                    />
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      value={(form.tags || []).join(', ')}
                      onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Tags: Near MRT, CBD, Student-friendly (comma-separated)"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex-shrink-0 sticky bottom-0 z-10">
          <Button variant="outline" onClick={closeAndReset} className="px-6">
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))} className="px-6">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < 5 ? (
              <Button onClick={() => setStep((s) => (s < 5 ? ((s + 1) as Step) : s))} disabled={!canNext} className="bg-green-600 hover:bg-green-700 text-white px-6 shadow-lg">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white px-8 shadow-lg">
                {submitting ? "Creating..." : "Create Property"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

