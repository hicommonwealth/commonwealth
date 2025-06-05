import { TwitterBotName } from '@hicommonwealth/shared';
import { z } from 'zod/v4';

export const TwitterCursor = z.object({
  bot_name: z.nativeEnum(TwitterBotName),
  last_polled_timestamp: z.bigint(),
});
