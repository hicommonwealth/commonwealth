import { CapacitorConfig } from '@capacitor/cli';

let config: CapacitorConfig;

const baseConfig: CapacitorConfig = {
  appId: 'common.xyz',
  appName: 'Common',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    // SplashScreen: {
    //   launchShowDuration: 5000,
    //   launchAutoHide: true,
    // },
    // FirebaseMessaging: {
    //   presentationOptions: ['badge', 'sound', 'alert'],
    // },
    // CapacitorCookies: {
    //   enabled: true,
    // },
  },
  ios: {
    allowsLinkPreview: true,
  },
};

switch (process.env.NODE_ENV) {
  case 'local':
    config = {
      ...baseConfig,
    };
    break;
  case 'mobile':
    config = {
      ...baseConfig,
      server: {
        url: process.env.SERVICE_URL,
        hostname: 'http://localhost:8080', // If SERVER = localhost:8080/api, hostname = localhost:8080
        cleartext: true,
        allowNavigation: ['*'],
      },
    };
    break;
  case 'alpha':
    config = {
      ...baseConfig,
      server: {
        url: 'https://alpha.common.xyz/api',
        cleartext: true,
        allowNavigation: ['*'],
      },
    };
    break;
  default:
    config = {
      ...baseConfig,
    };
    break;
}

export default config;
