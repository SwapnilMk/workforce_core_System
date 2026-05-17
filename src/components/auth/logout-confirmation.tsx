'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

interface LogoutConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmation({ onConfirm, onCancel }: LogoutConfirmationProps) {
  const [step, setStep] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [hoursToday, setHoursToday] = useState<number | null>(null);
  const [loadingHours, setLoadingHours] = useState(true);
  const scanTriggeredRef = useRef(false);
  const isMobile = Capacitor.isNativePlatform();

  // Fetch today's work hours
  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch('/api/attendance');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.logs) {
            const todayStr = new Date().toDateString();
            let sum = 0;
            const todayLogs = data.logs.filter((log: any) => {
              return new Date(log.date).toDateString() === todayStr && !log.failedAttempt;
            });
            todayLogs.forEach((log: any) => {
              if (log.workHours) {
                sum += log.workHours;
              } else if (log.checkIn && !log.checkOut) {
                const sessionMs = new Date().getTime() - new Date(log.checkIn).getTime();
                sum += sessionMs / (1000 * 60 * 60);
              }
            });
            setHoursToday(Math.round(sum * 100) / 100);
          }
        }
      } catch (err) {
        console.error('Failed to load hours on logout:', err);
      } finally {
        setLoadingHours(false);
      }
    };
    fetchHours();
  }, []);

  const startScan = async () => {
    if (!isMobile) return;
    if (step !== 'idle') return;

    setStep('scanning');
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      const avail = await NativeBiometric.isAvailable();
      if (avail.isAvailable) {
        await NativeBiometric.verifyIdentity({
          reason: 'Confirm biometric identity to log out securely.',
          title: 'Verify Fingerprint',
          subtitle: 'Secure Logout Verification',
          description: 'Please scan your fingerprint to authorize your session logout.',
          maxAttempts: 3
        });
        setStep('success');
        setTimeout(onConfirm, 800);
      } else {
        runSimulatedScanOnMobile();
      }
    } catch (err: any) {
      console.error('Biometric authentication failed:', err);
      setStep('idle');
      toast.error('Biometric verification cancelled or failed.');
    }
  };

  const runSimulatedScanOnMobile = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('success');
      setTimeout(onConfirm, 800);
    }, 1800);
  };

  // Auto-triggering flows once loading completes
  useEffect(() => {
    if (loadingHours) return;

    if (!isMobile) {
      // Desktop: Display work hours and auto-logout after 3 seconds
      const timer = setTimeout(() => {
        onConfirm();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Mobile: Auto-prompt fingerprint after showing the work hours
      if (!scanTriggeredRef.current) {
        scanTriggeredRef.current = true;
        const timer = setTimeout(() => {
          startScan();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [loadingHours, isMobile]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm p-8 rounded-3xl bg-card border-2 border-primary/20 shadow-2xl text-center space-y-6 text-white"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Security Check</h2>
          <p className="text-muted-foreground text-xs">
            Confirming and securing your workspace session
          </p>
        </div>

        {/* Dynamic Work Hours Display */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-2 transition-all">
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 font-semibold tracking-wider uppercase">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Today's Work Duration</span>
          </div>
          {loadingHours ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-3xl font-black text-white bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent italic">
                {hoursToday !== null ? `${hoursToday.toFixed(2)} Hrs` : '0.00 Hrs'}
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">
                {hoursToday && hoursToday >= 8 
                  ? '🎯 Daily target achieved! Excellent job today!' 
                  : '👍 Session details logged successfully.'}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic platform actions */}
        <div className="relative flex items-center justify-center py-4">
          <AnimatePresence mode="wait">
            {!isMobile ? (
              // Desktop: Smooth countdown progress transition
              <motion.div
                key="desktop-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 w-full animate-in fade-in duration-300"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em]">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span>Logging out in 3s...</span>
                </div>
                {/* Visual Countdown Progress Bar */}
                <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-400"
                  />
                </div>
              </motion.div>
            ) : (
              // Mobile: Fingerprint prompt
              <>
                {step === 'idle' && (
                  <motion.button
                    key="idle"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startScan}
                    className="relative group cursor-pointer bg-transparent border-none outline-none"
                  >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all" />
                    <div className="relative p-6 rounded-full border-2 border-primary/50 bg-primary/5 group-hover:border-primary transition-all">
                      <Fingerprint className="w-16 h-16 text-primary" />
                    </div>
                    <div className="mt-4 text-xs font-bold text-primary uppercase tracking-[0.2em] animate-pulse">
                      Tap to Scan Fingerprint
                    </div>
                  </motion.button>
                )}

                {step === 'scanning' && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative">
                       <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-50" />
                       <div className="p-6 rounded-full bg-primary/10">
                         <Loader2 className="w-16 h-16 text-primary animate-spin" />
                       </div>
                       <motion.div 
                         initial={{ top: '0%' }}
                         animate={{ top: '100%' }}
                         transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                         className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(59,130,246,1)] z-10"
                       />
                    </div>
                    <div className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                      Awaiting Biometric...
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="p-6 rounded-full bg-green-500/20">
                      <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </div>
                    <div className="text-xs font-bold text-green-500 uppercase tracking-[0.2em]">
                      Identity Verified
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {isMobile && (
          <button 
            onClick={onCancel}
            className="text-xs font-bold text-neutral-400 uppercase tracking-widest hover:text-white transition-colors bg-transparent border-none cursor-pointer outline-none"
          >
            Cancel and return
          </button>
        )}
      </motion.div>
    </div>
  );
}
