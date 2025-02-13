import { TwitterBotName } from '@hicommonwealth/shared';
import { z } from 'zod';

export const TwitterCursor = z.object({
  bot_name: z.nativeEnum(TwitterBotName),
  last_polled_timestamp: z.number(),
});
