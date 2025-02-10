import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';

const log = logger(import.meta);

const inputs = {
  TwitterMomBotMentioned: events.TwitterMomBotMentioned,
};

export function MomBotPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TwitterMomBotMentioned: async ({ payload }) => {
        log.info('MomBotPolicy', payload);
      },
    },
  };
}
