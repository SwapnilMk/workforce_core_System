import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egc.workforce',
  appName: 'EGC_Workforce',
  webDir: 'out',
  server: {
    // 💡 LOCAL DEVELOPMENT: Uncomment this line to connect the Android Emulator directly to your computer's local dev server:
    "url": "http://10.0.2.2:3000",
    
    // 🌐 PRODUCTION DEPLOYMENT: Replace with your actual live hosted website domain:
    // "url": "https://workforce-core-system.vercel.app", 
    "cleartext": true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
