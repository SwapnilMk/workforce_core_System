import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState(false);
  const [biometryType, setBiometryType] = useState<any>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function checkSupport() {
      try {
        const result = await NativeBiometric.isAvailable();
        if (result.isAvailable) {
          setIsSupported(true);
          // Set type (e.g. fingerprint or face)
          setBiometryType(result.biometryType as any || 'fingerprint');
        }
      } catch (err) {
        console.error('Native biometric hardware check failed:', err);
      }
    }

    checkSupport();
  }, []);

  const authenticate = async (reason: string = 'Scan biometrics to confirm identity'): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // 💻 Desktop testing fallback
      console.log('Running in browser context. Bypassing hardware biometric check (Simulated success).');
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1200); // simulate delay
      });
    }

    if (!isSupported) {
      console.warn('Biometric sensors are not enrolled or available on this device.');
      return false;
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'EGC Biometric Verification',
        subtitle: 'Secure Attendance Punch Terminal',
        description: 'Verify your fingerprint or face to register check-in coordinates.',
        maxAttempts: 3
      });
      return true;
    } catch (error: any) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  };

  return { isSupported, biometryType, authenticate };
}
