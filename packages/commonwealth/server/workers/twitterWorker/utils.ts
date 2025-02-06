import { EventNames, events, Tweet } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const TwitterBotConfigs = {
  MomBot: {
    twitterUserId: '1337',
    bearerToken: '<PASSWORD>',
  },
  ContestBot: {
    twitterUserId: '1338',
    bearerToken: '<PASSWORD>',
  },
} as const;

export type TwitterBotConfig =
  (typeof TwitterBotConfigs)[keyof typeof TwitterBotConfigs];

export type twitterMentions =
  | Array<{
      event_name: EventNames.TwitterMomBotMentioned;
      event_payload: z.infer<typeof events.TwitterMomBotMentioned>;
    }>
  | Array<{
      event_name: EventNames.TwitterContestBotMentioned;
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
        event_name: EventNames.TwitterContestBotMentioned,
        event_payload: t,
      };
    } else {
      return {
        event_name: EventNames.TwitterMomBotMentioned,
        event_payload: t,
      };
    }
  }) as twitterMentions;
}
