import { Analytics, AnalyticsOptions } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import MixpanelLib from 'mixpanel';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

export const MixpanelAnalytics = (): Analytics => {
  const log = logger(__filename);

  let mixpanelNode: MixpanelLib.Mixpanel;

  try {
    if (process.env.NODE_ENV === 'production') {
      mixpanelNode = MixpanelLib.init(process.env.MIXPANEL_PROD_TOKEN!);
    } else if (process.env.NODE_ENV === 'development') {
      // NOTE: Only works if NODE_ENV defined in .env
      // Make sure that is set to development if you want to use backend Mixpanel locally.
      mixpanelNode = MixpanelLib.init(process.env.MIXPANEL_DEV_TOKEN!);
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
