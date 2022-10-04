import { CapacitorConfig } from '@capacitor/cli';

let config: CapacitorConfig;

const baseConfig: CapacitorConfig = {
  appId: 'common.xyz',
  appName: 'Common',
  webDir: 'build',
  bundledWebRuntime: false,
  plugins: {
    "SplashScreen": {
      "launchShowDuration": 5000,
      "launchAutoHide": true,
    }
  },
  ios: {
    allowsLinkPreview: true
  }
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
        url: 'http://192.168.1.42:8080', // replace with your IP address + port
        cleartext: true,
        allowNavigation: ['*'],
      },
    };
    break;
  case 'staging':
    config = {
      ...baseConfig,
      server: {
        url: 'https://commonwealth-staging.herokuapp.com',
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
