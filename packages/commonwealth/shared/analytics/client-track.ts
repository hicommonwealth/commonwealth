import { AnalyticsPayload, BaseMixpanelPayload, providers } from './types';
import mixpanel from 'mixpanel-browser';

try {
  if (process.env.NODE_ENV === 'production') {
    mixpanel.init(process.env.MIXPANEL_PROD_TOKEN, { debug: true });
  } else if (process.env.NODE_ENV === 'development') {
    // NOTE: Only works if NODE_ENV defined in .env
    // Make sure that is set to development if you want to use backend Mixpanel locally.
    mixpanel.init('312b6c5fadb9a88d98dc1fb38de5d900', { debug: true });
  }
} catch (e) {
  console.log('Unable to initialized the backend mixpanel client: ', e);
}

// ----- Client Side Mixpanel Library Utils ------ //
export function mixpanelBrowserTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;
  try {
    mixpanel.track(event, payload);
  } catch (e) {
    console.log(`Failed to track event, ${event.toString()}:`, e.message);
  }
}

// ----- Server Side Analytics Agnostic Provider Utils ------ //
export function clientAnalyticsTrack(payload: AnalyticsPayload) {
  providers.forEach((provider) => {
    switch (provider) {
      case 'mixpanel':
        mixpanelBrowserTrack(payload as BaseMixpanelPayload);
        break;
      // Add more providers here
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  });
}
