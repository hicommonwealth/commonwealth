import mixpanel from 'mixpanel-browser';
import { AnalyticsPayload, BaseMixpanelPayload, providers } from './types';

// WARN: Using process.env to avoid webpack failures
try {
  if (process.env.APP_ENV === 'production') {
    mixpanel.init(process.env.MIXPANEL_PROD_TOKEN, {
      debug: true,
    });
  } else if (process.env.APP_ENV === 'local') {
    mixpanel.init(process.env.MIXPANEL_DEV_TOKEN, {
      debug: true,
    });
  }
} catch (e) {
  console.log('Unable to initialize the frontend mixpanel: ', e);
}

// ----- Client Side Mixpanel Library Utils ------ //
export function mixpanelBrowserTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;
  try {
    mixpanel.track(event, payload);
  } catch (e) {
    console.log(
      `Failed to track frontend mixpanel event, ${event.toString()}:`,
      e.message,
    );
  }
}

// ----- Server Side Analytics Agnostic Provider Utils ------ //
export function clientAnalyticsTrack<T extends AnalyticsPayload>(payload: T) {
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
