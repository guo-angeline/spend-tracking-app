import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.financeapp',
  appName: 'finance-app',
  webDir: 'out',
  server: {
    iosScheme: 'https',
    androidScheme: 'https'
  }
};

export default config;
