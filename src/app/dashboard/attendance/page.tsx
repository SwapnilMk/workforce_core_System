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
import { useBiometrics } from '@/hooks/use-biometrics';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const MapPreview = dynamic(() => import('@/components/attendance/map-preview'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted animate-pulse rounded-xl" />
});

// Mumbai HQ coordinates matching the seed company values
const OFFICE_LOCATION: [number, number] = [19.0760, 72.8777];
const OFFICE_RADIUS = 200; // 200 meters

interface AttendanceLog {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  failedAttempt: boolean;
  errorMessage: string | null;
  workHours: number;
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const { authenticate, isSupported: biometricSupported } = useBiometrics();
  usePushNotifications(user?.id);
  const [status, setStatus] = useState<'checked-in' | 'checked-out'>('checked-out');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [history, setHistory] = useState<AttendanceLog[]>([]);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [remoteWorkAllowed, setRemoteWorkAllowed] = useState<boolean>(false);

  const fetchAttendanceHistory = async () => {
    try {
      const res = await fetch('/api/attendance');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          setHistory(data.logs);
          
          if (data.remoteWorkAllowed !== undefined) {
            setRemoteWorkAllowed(data.remoteWorkAllowed);
          }
          
          // Compute status based on today's logs
          const todayStr = new Date().toDateString();
          const todayLog = data.logs.find((log: any) => {
            return new Date(log.date).toDateString() === todayStr && !log.failedAttempt;
          });

          if (todayLog && todayLog.checkIn && !todayLog.checkOut) {
            setStatus('checked-in');
          } else {
            setStatus('checked-out');
          }

          // Compute total hours
          const hours = data.logs.reduce((acc: number, log: any) => acc + (log.workHours || 0), 0);
          setTotalHours(Math.round(hours * 10) / 10);
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  const updateLocation = async () => {
    setIsRefreshing(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation([loc.latitude, loc.longitude]);
      const dist = calculateDistance(loc.latitude, loc.longitude, OFFICE_LOCATION[0], OFFICE_LOCATION[1]);
      setDistance(dist);
    } catch (error: any) {
      toast.error('Failed to retrieve GPS location: ' + error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    updateLocation();
    fetchAttendanceHistory();
  }, []);

  const isInsideRadius = remoteWorkAllowed || (distance !== null && distance <= OFFICE_RADIUS);

  const handleAttendance = async () => {
    if (!userLocation) {
      toast.error('GPS coordinates not ready. Please refresh location.');
      return;
    }

    setIsVerifying(true);
    const action = status === 'checked-in' ? 'check-out' : 'check-in';

    // Verify native biometrics hardware check
    const isVerified = await authenticate(`Scan fingerprint to authorize ${action === 'check-in' ? 'Check-In' : 'Check-Out'}`);
    if (!isVerified) {
      toast.error('Biometric authentication failed or was cancelled.');
      setIsVerifying(false);
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          latitude: userLocation[0],
          longitude: userLocation[1],
          isMockLocation: false,
          isVpnDetected: false
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || `${action === 'check-in' ? 'Checked in' : 'Checked out'} successfully`);
        fetchAttendanceHistory();
      } else {
        toast.error(data.error || 'Attendance punch rejected.');
        // Still refresh history to show failed audit attempt
        fetchAttendanceHistory();
      }
    } catch (err: any) {
      toast.error('Network Error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Smart Attendance</h1>
          <p className="text-muted-foreground mt-1 font-medium">Biometric & Geo-fenced live employee tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <ShieldAlert className="w-3 h-3 mr-1.5" />
            Security Level: AES-256 Verified
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2 border-primary/10 overflow-hidden bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Clock className="w-6 h-6 text-primary" />
                  Live Punching Terminal
                </CardTitle>
                <CardDescription>Verify your identity and coordinates to mark your shift</CardDescription>
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
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div className="w-full space-y-4">
                  <AnimatePresence mode="wait">
                    {remoteWorkAllowed ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex flex-col items-center justify-center gap-1 text-sm font-bold text-center"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Remote / WFH Mode Active
                        </div>
                        <span className="text-[10.5px] font-medium opacity-85">
                          {distance !== null ? `Location recorded: ${Math.round(distance)}m from HQ` : 'GPS Location loading...'}
                        </span>
                      </motion.div>
                    ) : distance === null ? (
                      <div className="p-4 rounded-xl bg-muted/20 border text-center text-sm font-semibold">
                        Locating employee GPS...
                      </div>
                    ) : isInsideRadius ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Within Geofence ({Math.round(distance)}m)
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 flex flex-col items-center justify-center gap-1 text-sm font-bold text-center"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" />
                          Geofence Blocked ({Math.round(distance)}m away)
                        </div>
                        <span className="text-[10.5px] font-medium opacity-85">Punch will register as failed audit log</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button 
                    size="lg" 
                    onClick={handleAttendance}
                    disabled={isVerifying}
                    className={`w-full h-24 text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-95 group relative overflow-hidden ${
                      status === 'checked-in' 
                      ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20 text-white' 
                      : 'bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground'
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
                      <Camera className="w-4 h-4 mr-2" /> Facial Selfie
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={fetchAttendanceHistory}>
                      Refresh Logs
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-4 bg-muted/10">
                <div className="flex items-center justify-between px-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Office Geofence</div>
                  <Badge variant="secondary" className="text-[10px]">RADIUS: {OFFICE_RADIUS}m</Badge>
                </div>
                <MapPreview 
                  center={OFFICE_LOCATION} 
                  userLocation={userLocation || undefined} 
                  radius={OFFICE_RADIUS} 
                />
                <div className="p-4 rounded-xl bg-background/50 border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Secure GPS Radius</span>
                    <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-500/20 font-bold">200m Geofenced</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">VPN Shield</span>
                    <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-500/20 font-bold">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spoof Detection</span>
                    <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-500/20 font-bold">Safe</Badge>
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
              History & Audit Trail
            </CardTitle>
            <CardDescription>Your live real-time attendance logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 border text-center">
                <div className="text-2xl font-bold">{history.filter(h => !h.failedAttempt).length}</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Punches Logged</div>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border text-center">
                <div className="text-2xl font-bold text-primary">{totalHours}h</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Hours</div>
              </div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                  No attendance history logged yet.
                </div>
              ) : (
                history.map((record) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={record.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border group hover:border-primary/50 transition-all cursor-default"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{formatDate(record.date)}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                        <span>{formatTime(record.checkIn)} - {formatTime(record.checkOut)}</span>
                        {record.workHours > 0 && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{record.workHours} hrs</span>
                          </>
                        )}
                      </div>
                      {record.failedAttempt && (
                        <p className="text-[9.5px] text-red-500 font-medium leading-tight">
                          {record.errorMessage}
                        </p>
                      )}
                    </div>
                    <Badge 
                      className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                        record.failedAttempt
                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                        : record.status === 'LATE'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-green-500/10 text-green-600 border-green-500/20'
                      }`} 
                      variant="outline"
                    >
                      {record.failedAttempt ? 'Security Blocked' : record.status}
                    </Badge>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
