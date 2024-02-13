import { Analytics, AnalyticsOptions, logger } from '@hicommonwealth/core';
import MixpanelLib from 'mixpanel';

const log = logger().getLogger(__filename);

export const MixpanelAnalytics = (): Analytics => {
  let mixpanelNode;

  try {
    if (process.env.NODE_ENV === 'production') {
      mixpanelNode = MixpanelLib.init(process.env.MIXPANEL_PROD_TOKEN);
    } else if (process.env.NODE_ENV === 'development') {
      // NOTE: Only works if NODE_ENV defined in .env
      // Make sure that is set to development if you want to use backend Mixpanel locally.
      mixpanelNode = MixpanelLib.init(process.env.MIXPANEL_DEV_TOKEN);
    }
  } catch (e) {
    log.error('Unable to initialized the backend mixpanel client: ', e);
  }

  return {
    name: 'mixpanel-analytics',
    dispose: async () => {},
    track: (event: string, payload: AnalyticsOptions) => {
      try {
        mixpanelNode?.track(event, payload);
      } catch (e) {
        log.error(`Failed to track event, ${event.toString()}:`, e.message);
      }
    },
  };
};
