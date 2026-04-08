import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.dinefirst.app',
  appName: 'DineFirst',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#050816',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
