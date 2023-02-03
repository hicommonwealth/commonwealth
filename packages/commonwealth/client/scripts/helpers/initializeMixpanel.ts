import { MIXPANEL_DEV_TOKEN, MIXPANEL_PROD_TOKEN } from 'helpers/constants';
import mixpanel from 'mixpanel-browser';

const initializeMixpanel = () => {
  // initialize mixpanel, before adding an alias or tracking identity

  const isLocalhost =
    document.location.host.startsWith('localhost') ||
    document.location.host.startsWith('127.0.0.1');

  try {
    if (isLocalhost) {
      mixpanel.init(MIXPANEL_DEV_TOKEN, { debug: true });
    } else {
      // Production Mixpanel Project
      mixpanel.init(MIXPANEL_PROD_TOKEN, { debug: true });
    }
  } catch (e) {
    console.error('Mixpanel initialization error');
  }
};

export default initializeMixpanel;
