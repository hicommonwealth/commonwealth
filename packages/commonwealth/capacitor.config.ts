import { CapacitorConfig } from '@capacitor/cli';

let config: CapacitorConfig;

const baseConfig: CapacitorConfig = {
  appId: 'common.xyz',
  appName: 'Common',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 5000,
      launchAutoHide: true,
    },
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
        cleartext: true,
        allowNavigation: ['*'],
      },
    };
    break;
  case 'staging':
    config = {
      ...baseConfig,
      server: {
        url: 'https://commonwealth-staging.herokuapp.com/api',
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
