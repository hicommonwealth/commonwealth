import { mixpanelBrowserTrack, mixpanelTrack } from './mixpanel';
import { AnalyticsPayload, BaseMixpanelPayload } from './types';

const providers = ['mixpanel']; // add other providers here

export function serverAnalyticsTrack(payload: AnalyticsPayload) {
  providers.forEach((provider) => {
    switch (provider) {
      case 'mixpanel':
        mixpanelTrack(payload as BaseMixpanelPayload);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  });
}

export function clientAnalyticsTrack(payload: AnalyticsPayload) {
  providers.forEach((provider) => {
    switch (provider) {
      case 'mixpanel':
        mixpanelBrowserTrack(payload as BaseMixpanelPayload);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  });
}
