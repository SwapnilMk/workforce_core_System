'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LogoutConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmation({ onConfirm, onCancel }: LogoutConfirmationProps) {
  const [step, setStep] = useState<'idle' | 'scanning' | 'success'>('idle');

  const startScan = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('success');
      setTimeout(onConfirm, 800);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm p-8 rounded-3xl bg-card border-2 border-primary/20 shadow-2xl text-center space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Security Check</h2>
          <p className="text-muted-foreground text-sm">Verify biometric to confirm secure logout</p>
        </div>

        <div className="relative flex items-center justify-center py-10">
          <AnimatePresence mode="wait">
            {step === 'idle' && (
              <motion.button
                key="idle"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startScan}
                className="relative group cursor-pointer"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all" />
                <div className="relative p-6 rounded-full border-2 border-primary/50 bg-primary/5 group-hover:border-primary transition-all">
                  <Fingerprint className="w-16 h-16 text-primary" />
                </div>
                <div className="mt-4 text-xs font-bold text-primary uppercase tracking-[0.2em] animate-pulse">
                  Hold to Verify
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
                  Scanning...
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
          </AnimatePresence>
        </div>

        <button 
          onClick={onCancel}
          className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-white transition-colors"
        >
          Cancel and return
        </button>
      </motion.div>
    </div>
  );
}
