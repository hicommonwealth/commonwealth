import Mixpanel from 'mixpanel';
import { AnalyticsPayload, BaseMixpanelPayload, providers } from './types';

let mixpanelNode;

try {
  if (process.env.NODE_ENV === 'production') {
    mixpanelNode = Mixpanel.init(process.env.MIXPANEL_PROD_TOKEN);
  } else if (process.env.NODE_ENV === 'development') {
    // NOTE: Only works if NODE_ENV defined in .env
    // Make sure that is set to development if you want to use backend Mixpanel locally.
    mixpanelNode = Mixpanel.init(process.env.MIXPANEL_DEV_TOKEN);
  }
} catch (e) {
  console.log('Unable to initialized the backend mixpanel client: ', e);
}

// ----- Server Side Mixpanel Library Utils ------ //
export function mixpanelTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;
  try {
    mixpanelNode?.track(event, payload);
  } catch (e) {
    console.log(`Failed to track event, ${event.toString()}:`, e.message);
  }
}

export function serverAnalyticsTrack<T extends AnalyticsPayload>(payload: T) {
  providers.forEach((provider) => {
    switch (provider) {
      case 'mixpanel':
        mixpanelTrack(payload as BaseMixpanelPayload);
        break;
      // Add more providers here
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  });
}
