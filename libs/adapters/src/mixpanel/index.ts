import { Analytics, AnalyticsOptions, logger } from '@hicommonwealth/core';
import MixpanelLib from 'mixpanel';
import { config } from '../config';

export const MixpanelAnalytics = (): Analytics => {
  const log = logger(import.meta);

  let mixpanelNode: MixpanelLib.Mixpanel | undefined = undefined;

  try {
    mixpanelNode = MixpanelLib.init(config.ANALYTICS.MIXPANEL_TOKEN!);
  } catch (e) {
    log.error('Unable to initialize the backend mixpanel: ', e as Error);
  }

  return {
    name: 'MixpanelAnalytics',
    dispose: async () => {},
    track: (event: string, payload: AnalyticsOptions) => {
      try {
        mixpanelNode?.track(event, payload);
      } catch (e) {
        log.error(
          `Failed to track backend mixpanel event, ${event.toString()}:`,
          e as Error,
        );
      }
    },
  };
};
