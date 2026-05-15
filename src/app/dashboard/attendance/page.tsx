'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CheckCircle2, History, ShieldAlert, Fingerprint, RefreshCcw, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getCurrentLocation, calculateDistance } from '@/lib/geo';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth-store';

const MapPreview = dynamic(() => import('@/components/attendance/map-preview'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl" />
});

// Mock Office Location (Mumbai)
const OFFICE_LOCATION: [number, number] = [19.0760, 72.8777];
const OFFICE_RADIUS = 200; // 200 meters

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'checked-in' | 'checked-out'>('checked-out');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [history] = useState([
    { date: '2024-05-14', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present', type: 'Office' },
    { date: '2024-05-13', checkIn: '08:55 AM', checkOut: '06:05 PM', status: 'Present', type: 'Office' },
    { date: '2024-05-12', checkIn: '10:15 AM', checkOut: '07:15 PM', status: 'Late', type: 'Remote' },
    { date: '2024-05-11', checkIn: '-', checkOut: '-', status: 'Absent', type: '-' },
  ]);

  const updateLocation = async () => {
    setIsRefreshing(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation([loc.latitude, loc.longitude]);
      const dist = calculateDistance(loc.latitude, loc.longitude, OFFICE_LOCATION[0], OFFICE_LOCATION[1]);
      setDistance(dist);
    } catch (error: any) {
      toast.error('Failed to get location: ' + error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  const isInsideRadius = distance !== null && distance <= OFFICE_RADIUS;

  const handleAttendance = async () => {
    if (!isInsideRadius) {
      toast.error('Access Denied: You are outside the office geofence radius.');
      // Log failed attempt logic would go here
      return;
    }

    setIsVerifying(true);
    // Simulate biometric check
    setTimeout(() => {
      setStatus(status === 'checked-in' ? 'checked-out' : 'checked-in');
      setIsVerifying(false);
      toast.success(status === 'checked-in' ? 'Checked out successfully' : 'Checked in successfully');
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Smart Attendance</h1>
          <p className="text-muted-foreground mt-1">Biometric & Geo-fenced workforce tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20 text-primary">
            <ShieldAlert className="w-3 h-3 mr-1.5" />
            Security Level: AES-256
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 border-primary/10 overflow-hidden bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Clock className="w-6 h-6 text-primary" />
                  Live Punching Terminal
                </CardTitle>
                <CardDescription>Verify your identity and location to mark attendance</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={updateLocation} 
                disabled={isRefreshing}
                className="rounded-full"
              >
                <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              <div className="p-8 flex flex-col items-center justify-center space-y-8 border-r border-border/50">
                <div className="text-center space-y-2">
                  <div className="text-6xl font-mono font-bold tracking-tighter text-primary">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div className="w-full space-y-4">
                  <AnimatePresence mode="wait">
                    {isInsideRadius ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Within Office Radius ({Math.round(distance || 0)}m)
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Outside Radius ({Math.round(distance || 0)}m)
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button 
                    size="lg" 
                    onClick={handleAttendance}
                    disabled={isVerifying}
                    className={`w-full h-24 text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-95 group relative overflow-hidden ${
                      status === 'checked-in' 
                      ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20' 
                      : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isVerifying ? (
                        <motion.div 
                          key="verifying"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center gap-1"
                        >
                          <Fingerprint className="w-8 h-8 animate-pulse text-white/50" />
                          <span className="text-sm font-medium">Scanning Biometrics...</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="idle"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center"
                        >
                          <Fingerprint className="w-10 h-10 mb-1 group-hover:scale-110 transition-transform" />
                          <span>{status === 'checked-in' ? 'Check Out' : 'Check In'}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-11 border-primary/20 bg-primary/5 hover:bg-primary/10">
                      <Camera className="w-4 h-4 mr-2" /> Selfie
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl h-11">
                      Manual Log
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-4 bg-muted/10">
                <div className="flex items-center justify-between px-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Geofence Map</div>
                  <Badge variant="secondary" className="text-[10px]">RADIUS: {OFFICE_RADIUS}m</Badge>
                </div>
                <MapPreview 
                  center={OFFICE_LOCATION} 
                  userLocation={userLocation || undefined} 
                  radius={OFFICE_RADIUS} 
                />
                <div className="p-4 rounded-xl bg-background/50 border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Detected IP</span>
                    <span className="font-mono font-bold">192.168.1.45</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">VPN Status</span>
                    <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-500/20">Protected</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mock GPS</span>
                    <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-500/20">Clean</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <History className="w-5 h-5 text-primary" />
              History & Analytics
            </CardTitle>
            <CardDescription>Your last 7 days performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 border text-center">
                <div className="text-2xl font-bold">22</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Working Days</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border text-center">
                <div className="text-2xl font-bold text-primary">176h</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Hours</div>
              </div>
            </div>

            <div className="space-y-3">
              {history.map((record, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border group hover:border-primary/50 transition-all cursor-default"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-sm">{record.date}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                      <span>{record.checkIn} - {record.checkOut}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{record.type}</span>
                    </div>
                  </div>
                  <Badge 
                    className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                      record.status === 'Present' 
                      ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                      : record.status === 'Late'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-red-500/10 text-red-600 border-red-500/20'
                    }`} 
                    variant="outline"
                  >
                    {record.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-2 font-semibold hover:bg-primary/5 hover:text-primary">
              View Detailed Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
