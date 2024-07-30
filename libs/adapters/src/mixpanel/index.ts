import { Analytics, AnalyticsOptions, logger } from '@hicommonwealth/core';
import MixpanelLib from 'mixpanel';
import { fileURLToPath } from 'url';
import { config } from '../config';

export const MixpanelAnalytics = (): Analytics => {
  const __filename = fileURLToPath(import.meta.url);
  const log = logger(__filename);

  let mixpanelNode: MixpanelLib.Mixpanel;

  try {
    if (config.APP_ENV === 'production') {
      mixpanelNode = MixpanelLib.init(config.ANALYTICS.MIXPANEL_PROD_TOKEN!);
    } else if (config.ANALYTICS.MIXPANEL_DEV_TOKEN) {
      // NOTE: Only works if NODE_ENV defined in .env
      // Make sure that is set to development if you want to use backend Mixpanel locally.
      mixpanelNode = MixpanelLib.init(config.ANALYTICS.MIXPANEL_DEV_TOKEN!);
    }
  } catch (e) {
    log.error(
      'Unable to initialized the backend mixpanel client: ',
      e as Error,
    );
  }

  return {
    name: 'MixpanelAnalytics',
    dispose: async () => {},
    track: (event: string, payload: AnalyticsOptions) => {
      try {
        mixpanelNode?.track(event, payload);
      } catch (e) {
        log.error(`Failed to track event, ${event.toString()}:`, e as Error);
      }
    },
  };
};
