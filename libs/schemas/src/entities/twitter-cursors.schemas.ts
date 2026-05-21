import { TwitterBotName } from '@hicommonwealth/shared';
import { z } from 'zod';

export const TwitterCursor = z.object({
  bot_name: z.enum(TwitterBotName),
  last_polled_timestamp: z.bigint(),
});
