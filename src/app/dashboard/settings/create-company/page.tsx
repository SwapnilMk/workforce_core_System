'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  MapPin, 
  CreditCard, 
  Palette, 
  CheckSquare, 
  ShieldAlert,
  Loader2,
  ArrowLeft,
  Briefcase,
  Navigation
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Compliance validation regex
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CIN_REGEX = /^[LU]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

export default function CreateCompanyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    logo: '',
    email: '',
    phone: '',
    website: '',
    industryType: 'Technology',
    gstNumber: '',
    panNumber: '',
    cinNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    officeRadius: '200',
    latitude: '',
    longitude: '',
    planType: 'Trial',
    employeeLimit: '50',
    storageLimit: '10',
    primaryColor: '#1a365d',
    secondaryColor: '#0f172a',
    themePreference: 'dark',
    activeModules: ['ATTENDANCE', 'PAYROLL', 'LEAVES', 'DAILY_JD', 'CHAT'] as string[],
  });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setDetecting(true);
    toast.loading('Detecting coordinates...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss();
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setDetecting(false);
        toast.success('GPS coordinates successfully updated.');
      },
      (error) => {
        toast.dismiss();
        setDetecting(false);
        toast.error('Failed to get coordinates. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const circleRef = React.useRef<any>(null);
  const mapContainerId = "company-geofence-map";

  React.useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const L = (window as any).L;
    if (!L) {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          initMap();
        };
        document.head.appendChild(script);
      }
      return;
    }

    initMap();

    function initMap() {
      const L = (window as any).L;
      const lat = parseFloat(form.latitude) || 19.0760;
      const lng = parseFloat(form.longitude) || 72.8777;
      const radius = parseFloat(form.officeRadius) || 200;

      // If map is already initialized, just update the marker, circle, and pan the view
      if (mapRef.current) {
        const map = mapRef.current;
        
        // Prevent recursive panning if coordinates are already close (from dragging)
        const currentCenter = map.getCenter();
        const dist = currentCenter.distanceTo([lat, lng]);
        if (dist > 1) { // only pan if coordinate changed by more than 1 meter (e.g. manual typing)
          map.setView([lat, lng], 15);
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          markerRef.current.setPopupContent(`<b>${form.name || 'Office Location'}</b><br>Lat: ${lat}, Lng: ${lng}`);
        }
        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng]);
          circleRef.current.setRadius(radius);
        }
        return;
      }

      // Check if element exists
      const container = document.getElementById(mapContainerId);
      if (!container) return;

      try {
        const map = L.map(mapContainerId).setView([lat, lng], 15);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
          .bindPopup(`<b>${form.name || 'Office Location'}</b><br>Lat: ${lat}, Lng: ${lng}`)
          .openPopup();
        markerRef.current = marker;

        const circle = L.circle([lat, lng], {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          radius: radius
        }).addTo(map);
        circleRef.current = circle;

        // Listen to marker dragend
        marker.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          setForm((prev: any) => ({
            ...prev,
            latitude: position.lat.toFixed(6),
            longitude: position.lng.toFixed(6)
          }));
        });

        // Listen to map click to place marker anywhere
        map.on('click', (e: any) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          setForm((prev: any) => ({
            ...prev,
            latitude: clickLat.toFixed(6),
            longitude: clickLng.toFixed(6)
          }));
        });

      } catch (err) {
        console.error("Map initialization failed: ", err);
      }
    }
  }, [form.latitude, form.longitude, form.officeRadius, form.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name) {
      toast.error('Company Name is required.');
      return;
    }

    // Validation checks
    if (form.panNumber && !PAN_REGEX.test(form.panNumber)) {
      toast.error('Invalid PAN Number format (e.g. ABCDE1234F).');
      return;
    }
    if (form.gstNumber && !GST_REGEX.test(form.gstNumber)) {
      toast.error('Invalid GSTIN format (e.g. 27AAAAA1111A1Z1).');
      return;
    }
    if (form.cinNumber && !CIN_REGEX.test(form.cinNumber)) {
      toast.error('Invalid CIN Number format (e.g. L01234DL2022PLC123456).');
      return;
    }

    // Geofence checks
    if (form.latitude || form.longitude) {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast.error('Latitude must be between -90 and 90.');
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast.error('Longitude must be between -180 and 180.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          employeeLimit: parseInt(form.employeeLimit) || 50,
          storageLimit: parseInt(form.storageLimit) || 10,
          officeRadius: parseFloat(form.officeRadius) || 200,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Company '${form.name}' provisioned successfully!`);
        router.push('/dashboard/settings');
      } else {
        toast.error(data.error || 'Failed to create company.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Connection failure.');
    } finally {
      setSubmitting(false);
    }
  };

  const dynamicStyles = `
    :root {
      --primary-custom: ${form.primaryColor || '#1a365d'};
      --secondary-custom: ${form.secondaryColor || '#0f172a'};
    }
    .bg-primary-custom {
      background-color: var(--primary-custom) !important;
    }
    .text-primary-custom {
      color: var(--primary-custom) !important;
    }
    .border-primary-custom {
      border-color: var(--primary-custom) !important;
    }
    .hover-bg-primary-custom:hover {
      opacity: 0.9 !important;
    }
  `;

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto rounded-2xl border border-border/80 bg-background/50 backdrop-blur-xl p-4 sm:p-6 text-white min-h-[calc(100dvh-7.5rem)]">
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      
      {/* Header with Back button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4 w-full">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/dashboard/settings')}
            className="rounded-xl border border-neutral-800 hover:bg-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              ADD COMPANY
            </h1>
            <p className="text-neutral-400 text-xs font-medium">Fill in details to register a new company.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6 pb-12">
        {/* Core Profile Details */}
        <Card className="bg-neutral-950/60 border-neutral-800 backdrop-blur-md shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" /> Company Details
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">Enter basic contact details for the company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Company Name *</Label>
                <Input 
                  placeholder="E.g. EGC Corporate India" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                  required 
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Company Logo URL</Label>
                <Input 
                  placeholder="E.g. https://domain.com/logo.png" 
                  value={form.logo} 
                  onChange={(e) => setForm({...form, logo: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Contact Business Email</Label>
                <Input 
                  type="email"
                  placeholder="E.g. hr@egccorporate.com" 
                  value={form.email} 
                  onChange={(e) => setForm({...form, email: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Contact Business Phone</Label>
                <Input 
                  placeholder="E.g. +91 98765 43210" 
                  value={form.phone} 
                  onChange={(e) => setForm({...form, phone: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address & Geofence */}
        <Card className="bg-neutral-950/60 border-neutral-800 backdrop-blur-md shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" /> Company Address
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">Enter headquarters physical address and coordinates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left md:col-span-3">
                <Label className="text-xs font-semibold text-neutral-300">Physical Address</Label>
                <Input 
                  placeholder="E.g. 123 Corporate Park, Tech Zone" 
                  value={form.address} 
                  onChange={(e) => setForm({...form, address: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">City</Label>
                <Input 
                  placeholder="E.g. Mumbai" 
                  value={form.city} 
                  onChange={(e) => setForm({...form, city: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">State</Label>
                <Input 
                  placeholder="E.g. Maharashtra" 
                  value={form.state} 
                  onChange={(e) => setForm({...form, state: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">ZIP Code</Label>
                <Input 
                  placeholder="E.g. 400001" 
                  value={form.zipCode} 
                  onChange={(e) => setForm({...form, zipCode: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>

              {/* Coordinates Section with GPS Detector Button */}
              <div className="space-y-1.5 text-left md:col-span-3 border-t border-neutral-900/60 pt-4 mt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-500" /> Geofence & Location Marker
                    </h4>
                    <p className="text-[11px] text-neutral-400">Specify coordinates and maximum clock-in radius boundary for employee check-ins.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectLocation}
                    disabled={detecting}
                    className="border-neutral-800 hover:bg-neutral-900 text-[11px] h-8 gap-1.5 px-3 rounded-lg text-emerald-400 border-emerald-900/50 bg-emerald-950/20"
                  >
                    {detecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                    Detect GPS Location
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Office Latitude</Label>
                <Input 
                  placeholder="E.g. 19.0760" 
                  value={form.latitude} 
                  onChange={(e) => setForm({...form, latitude: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Office Longitude</Label>
                <Input 
                  placeholder="E.g. 72.8777" 
                  value={form.longitude} 
                  onChange={(e) => setForm({...form, longitude: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Radius Limit (Meters)</Label>
                <Input 
                  type="number" 
                  placeholder="E.g. 200" 
                  value={form.officeRadius} 
                  onChange={(e) => setForm({...form, officeRadius: e.target.value})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10"
                />
              </div>

              {/* Map Preview */}
              <div className="space-y-2 text-left md:col-span-3 mt-4">
                <Label className="text-xs font-semibold text-neutral-300">Visual Geofence Map Preview</Label>
                <div 
                  id="company-geofence-map" 
                  className="w-full h-64 rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950/40 shadow-inner"
                  style={{ zIndex: 1 }}
                />
                <p className="text-[10px] text-neutral-500">
                  The green circle represents the geofenced attendance radius of <span className="text-emerald-400 font-bold">{form.officeRadius || '200'} meters</span> around the coordinates. Employees must be inside this boundary to successfully clock in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Government Compliance Tags */}
        <Card className="bg-neutral-950/60 border-neutral-800 backdrop-blur-md shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-500" /> Compliance Info
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">Enter legal PAN, GSTIN, and CIN registry numbers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">PAN Number (ABCDE1234F)</Label>
                <Input 
                  placeholder="E.g. ABCDE1234F" 
                  value={form.panNumber} 
                  onChange={(e) => setForm({...form, panNumber: e.target.value.toUpperCase()})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10 uppercase"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">GSTIN (27AAAAA1111A1Z1)</Label>
                <Input 
                  placeholder="E.g. 27AAAAA1111A1Z1" 
                  value={form.gstNumber} 
                  onChange={(e) => setForm({...form, gstNumber: e.target.value.toUpperCase()})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10 uppercase"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold text-neutral-300">Corporate CIN</Label>
                <Input 
                  placeholder="E.g. L01234DL2022PLC123456" 
                  value={form.cinNumber} 
                  onChange={(e) => setForm({...form, cinNumber: e.target.value.toUpperCase()})} 
                  className="bg-neutral-900 border-neutral-800 text-xs h-10 uppercase"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/settings')}
            className="h-12 border-neutral-800 hover:bg-neutral-900 text-white font-bold rounded-xl px-6"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={submitting}
            className="h-12 bg-primary-custom hover-bg-primary-custom text-white font-bold rounded-xl shadow-lg px-8"
          >
            {submitting ? (
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Adding Company...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <Briefcase className="w-4 h-4 text-white" />
                <span>Add Company</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
