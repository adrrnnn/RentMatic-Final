/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, ChevronLeft, ChevronRight, Building2, FileText, Home } from "lucide-react";
import { Button } from "@/components/Button";
import type { CreatePropertyData } from "@/types/firestore";
import maplibregl from "maplibre-gl";
import { getProvinces, getCitiesForProvince, getBarangaysForCity } from "@/lib/data/ph-locations";

type Step = 1 | 2 | 3 | 4 | 5;

interface PropertyCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreatePropertyData) => Promise<void>;
}

export function PropertyCreateWizard({ isOpen, onClose, onCreate }: PropertyCreateWizardProps) {
  const [windowHeight, setWindowHeight] = useState<number>(0);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown | null>(null);
  const markerRef = useRef<unknown | null>(null);
  const autocompleteRef = useRef<unknown | null>(null);
  const [locating, setLocating] = useState(false);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);

  // Form state (PH-focused)
  const [form, setForm] = useState<CreatePropertyData>(() => ({
    name: "",
    address: "",
    type: "Apartment",
    numberOfUnits: 0, // ignored on create flow; units added later
    description: "",
    imageURL: "",
    manager: "",
    addressPH: {},
    association: {},
    compliance: {},
    management: { issueOR: false, acceptsEWT: false, vatRegistered: false, percentageTaxRegistered: false },
    payments: { wallets: [], banks: [], currency: "PHP" },
    billingDefaults: { dueDay: 1, graceDays: 0, lateFeeType: "flat", lateFeeValue: 0, reminderDaysBefore: [3,1] },
    amenities: [],
    policies: {},
    tags: []
  }));

  const canNext = useMemo(() => {
    if (step === 1) return !!form.name && !!form.address;
    if (step === 2) return !!form.type;
    return true;
  }, [step, form]);

  useEffect(() => {
    if (!isOpen) return;
    // MapLibre requires no async loader; mark ready when modal opens
    setMapsReady(true);
  }, [isOpen]);

  useEffect(() => {
    const updateHeight = () => setWindowHeight(window.innerHeight);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Initialize map when step 1 and mapsReady
  useEffect(() => {
    if (!isOpen || step !== 1 || !mapsReady || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    const center = { lng: 120.9842, lat: 14.5995 };
    const maptilerStyle = (window as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_MAPTILER_STYLE || `https://api.maptiler.com/maps/streets-v2/style.json?key=${(window as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_MAPTILER_KEY ?? ''}`;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: maptilerStyle,
      center: [center.lng, center.lat],
      zoom: 14
    });
    mapInstanceRef.current = map as unknown;

    // Gracefully handle missing sprite images in the style (e.g., 'office')
    map.on('styleimagemissing', (e) => {
      const id = (e as unknown as { id: string }).id;
      if (!id) return;
      if ((map as maplibregl.Map).hasImage(id)) return;
      const empty = new Uint8Array([0, 0, 0, 0]);
      try {
        (map as maplibregl.Map).addImage(id, { width: 1, height: 1, data: empty });
      } catch { /* ignore */ }
    });

    const marker = new maplibregl.Marker({ draggable: true }).setLngLat([center.lng, center.lat]).addTo(map);
    markerRef.current = marker as unknown;

    marker.on('dragend', () => {
      const pos = (marker as maplibregl.Marker).getLngLat();
      setForm(prev => ({
        ...prev,
        addressPH: { ...prev.addressPH, lat: pos.lat, lng: pos.lng }
      }));
    });

    // Note: Autocomplete will be wired via MapTiler/Mapbox later; for now keep manual entry.
  }, [isOpen, step, mapsReady]);

  const reverseGeocode = async (lng: number, lat: number): Promise<string | null> => {
    const key = (window as unknown as { env?: Record<string, string> }).env?.NEXT_PUBLIC_MAPTILER_KEY;
    if (!key) return null;
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${key}`);
      if (!res.ok) return null;
      const data = await res.json();
      const text = data?.features?.[0]?.place_name || data?.features?.[0]?.properties?.address || null;
      return text ?? null;
    } catch {
      return null;
    }
  };

  const locateMe = () => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (!navigator.geolocation) return;
    setLocating(true);
    setAccuracyMeters(null);
    const map = mapInstanceRef.current as maplibregl.Map;
    const marker = markerRef.current as maplibregl.Marker;

    let stopped = false;
    const stop = () => { if (!stopped) { stopped = true; navigator.geolocation.clearWatch(watchId); setLocating(false); } };

    const watchId = navigator.geolocation.watchPosition(async (pos) => {
      if (stopped) return;
      const { latitude, longitude, accuracy } = pos.coords;
      setAccuracyMeters(accuracy ?? null);
      map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), 16), duration: 600 });
      marker.setLngLat([longitude, latitude]);
      // Stop when accuracy is reasonably good or after 2 updates
      if (accuracy !== null && accuracy <= 50) {
        const address = await reverseGeocode(longitude, latitude);
        setForm(prev => ({
          ...prev,
          address: address ?? prev.address,
          addressPH: { ...prev.addressPH, lat: latitude, lng: longitude }
        }));
        stop();
      }
    }, () => stop(), { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });

    // Safety timeout to stop watching after 10s
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
      // numberOfUnits ignored; units added later
      await onCreate({ ...form, numberOfUnits: 0 });
      closeAndReset();
    } catch {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalMaxHeight = windowHeight ? Math.max(480, Math.min(windowHeight - 48, 960)) : undefined;
  const contentMaxHeight = modalMaxHeight ? Math.max(300, modalMaxHeight - 200) : undefined;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-start sm:justify-center overflow-y-auto px-3 py-6" style={{ minHeight: windowHeight || undefined }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-[min(95vw,980px)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: modalMaxHeight ? `${modalMaxHeight}px` : undefined }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0 sticky top-0 z-10 bg-white">
          <div>
            <h2 className="text-xl font-semibold">Create Property</h2>
            <p className="text-sm text-gray-500">Step {step} of 5</p>
          </div>
          <Button variant="ghost" onClick={closeAndReset} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></Button>
        </div>
        {/* Green animated progress bar */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              className="h-full bg-gradient-to-r from-green-500 to-green-600"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5 text-center">Step {step} of 5</p>
        </div>

        {/* Content */}
        <div
          className="p-6 space-y-8 overflow-y-auto flex-1 min-h-0"
          style={{ maxHeight: contentMaxHeight ? `${contentMaxHeight}px` : undefined }}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Property Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g., MGC Condo Residences" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <input id="address-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Start typing address..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="border rounded-lg px-3 py-2" value={form.addressPH?.province || ""} onChange={(e) => setForm({ ...form, addressPH: { province: e.target.value, city: '', barangay: '' } })}>
                      <option value="">Select Province</option>
                      {getProvinces().map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select className="border rounded-lg px-3 py-2" value={form.addressPH?.city || ""} onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, city: e.target.value, barangay: '' } })} disabled={!form.addressPH?.province}>
                      <option value="">Select City/Municipality</option>
                      {form.addressPH?.province && getCitiesForProvince(form.addressPH.province).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="border rounded-lg px-3 py-2" value={form.addressPH?.barangay || ""} onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, barangay: e.target.value } })} disabled={!form.addressPH?.city}>
                      <option value="">Select Barangay</option>
                      {form.addressPH?.province && form.addressPH?.city && getBarangaysForCity(form.addressPH.province, form.addressPH.city).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input placeholder="Subdivision/Condo (optional)" className="border rounded-lg px-3 py-2" value={form.addressPH?.subdivision || ""} onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, subdivision: e.target.value } })} />
                    <input placeholder="Street (optional)" className="border rounded-lg px-3 py-2" value={form.addressPH?.street || ""} onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, street: e.target.value } })} />
                    <input placeholder="ZIP (optional)" className="border rounded-lg px-3 py-2" value={form.addressPH?.zip || ""} onChange={(e) => setForm({ ...form, addressPH: { ...form.addressPH, zip: e.target.value } })} />
                  </div>
                </div>
                <div className="w-full h-64 sm:h-72 lg:h-80 rounded-xl border overflow-hidden relative">
                  {!mapsReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading map...</div>
                  )}
                  <div ref={mapRef} className="w-full h-full" />
                  <div className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1.5 rounded-md text-xs shadow flex items-center gap-1"><MapPin className="w-3 h-3" /> Drag the pin to adjust</div>
                  <div className="absolute top-3 right-3 space-y-2">
                    <Button variant="outline" onClick={locateMe} disabled={locating} className="text-sm">
                      {locating ? 'Locating...' : 'Locate me'}
                    </Button>
                    {accuracyMeters !== null && (
                      <div className="bg-white/95 px-2 py-1 rounded text-[11px] shadow text-gray-700">
                        Accuracy: ~{Math.round(accuracyMeters)}m
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Property Type</label>
                    <select className="w-full border rounded-lg px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
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
                      <input placeholder="Specify property type" className="w-full border rounded-lg px-3 py-2 mt-2" onChange={(ev) => setForm({ ...form, tags: [...(form.tags||[]), ev.target.value] })} />
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Home className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Association/Condo Corp (optional)</label>
                    <input placeholder="e.g., Makati Condominium Corp." className="w-full border rounded-lg px-3 py-2" value={form.association?.name || ""} onChange={(e) => setForm({ ...form, association: { ...form.association, name: e.target.value } })} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Property Type</label>
                    <select className="w-full border rounded-lg px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
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
                      <input placeholder="Specify property type" className="w-full border rounded-lg px-3 py-2 mt-2" onChange={(ev) => setForm({ ...form, tags: [...(form.tags||[]), ev.target.value] })} />
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Home className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Association/Condo Corp (optional)</label>
                    <input placeholder="e.g., Makati Condominium Corp." className="w-full border rounded-lg px-3 py-2" value={form.association?.name || ""} onChange={(e) => setForm({ ...form, association: { ...form.association, name: e.target.value } })} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3-new" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Home className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Manager/Caretaker (optional)</label>
                    <input placeholder="Manager name" className="w-full border rounded-lg px-3 py-2" value={form.management?.managerName || ""} onChange={(e) => setForm({ ...form, management: { ...form.management, managerName: e.target.value } })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Email" className="border rounded-lg px-3 py-2" value={form.management?.email || ""} onChange={(e) => setForm({ ...form, management: { ...form.management, email: e.target.value } })} />
                      <input placeholder="PH Mobile +63..." className="border rounded-lg px-3 py-2" value={form.management?.phone || ""} onChange={(e) => setForm({ ...form, management: { ...form.management, phone: e.target.value } })} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Amenities & Policies (optional)</label>
                    <input className="w-full border rounded-lg px-3 py-2" placeholder="Amenities: 24/7 guard, CCTV, generator" value={(form.amenities||[]).join(', ')} onChange={(e) => setForm({ ...form, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                    <input placeholder="Pet policy (e.g., Cats/dogs allowed)" className="w-full border rounded-lg px-3 py-2" value={form.policies?.pets || ""} onChange={(e) => setForm({ ...form, policies: { ...form.policies, pets: e.target.value } })} />
                    <input placeholder="Smoking policy (e.g., No smoking)" className="w-full border rounded-lg px-3 py-2" value={form.policies?.smoking || ""} onChange={(e) => setForm({ ...form, policies: { ...form.policies, smoking: e.target.value } })} />
                    <textarea className="w-full border rounded-lg px-3 py-2 h-20" placeholder="Internal notes for staff/caretaker" value={form.manager || ''} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Description & Tags</label>
                    <textarea className="w-full border rounded-lg px-3 py-2 h-28" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the property..." />
                    <input className="w-full border rounded-lg px-3 py-2" value={(form.tags||[]).join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Tags: Near university, CBD, Student housing" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0 sticky bottom-0 z-10">
          <Button variant="outline" onClick={closeAndReset}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))} disabled={step === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < 5 ? (
              <Button onClick={() => setStep((s) => (s < 5 ? ((s + 1) as Step) : s))} disabled={!canNext}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                {submitting ? "Creating..." : "Create Property"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


