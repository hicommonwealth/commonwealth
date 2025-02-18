import { events, Tweet } from '@hicommonwealth/schemas';
import { TwitterBotName } from '@hicommonwealth/shared';
import { z } from 'zod';

export const TwitterBotConfigs = {
  [TwitterBotName.MomBot]: {
    name: TwitterBotName.MomBot,
    twitterUserId: '1337',
    bearerToken: '<PASSWORD>',
  },
  [TwitterBotName.ContestBot]: {
    name: TwitterBotName.ContestBot,
    twitterUserId: '1338',
    bearerToken: '<PASSWORD>',
  },
} as const;

export type TwitterBotConfig =
  (typeof TwitterBotConfigs)[keyof typeof TwitterBotConfigs];

export type twitterMentions =
  | Array<{
      event_name: 'TwitterMomBotMentioned';
      event_payload: z.infer<typeof events.TwitterMomBotMentioned>;
    }>
  | Array<{
      event_name: 'TwitterContestBotMentioned';
      event_payload: z.infer<typeof events.TwitterContestBotMentioned>;
    }>;

export function createMentionEvents(
  twitterBotConfig: TwitterBotConfig,
  tweets: z.infer<typeof Tweet>[],
): twitterMentions {
  return tweets.map((t) => {
    if (
      twitterBotConfig.twitterUserId ===
      TwitterBotConfigs.ContestBot.twitterUserId
    ) {
      return {
        event_name: 'TwitterContestBotMentioned',
        event_payload: t,
      };
    } else {
      return {
        event_name: 'TwitterMomBotMentioned',
        event_payload: t,
      };
    }
  }) as twitterMentions;
}
