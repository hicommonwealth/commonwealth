import { events, Tweet } from '@hicommonwealth/schemas';
import { TwitterBotName } from '@hicommonwealth/shared';
import { z } from 'zod';
import { config } from '../../config';

export const TwitterBotConfigs = {
  [TwitterBotName.MomBot]: {
    name: TwitterBotName.MomBot,
    // TODO: update
    username: 'mombot',
    twitterUserId: '1337',
    bearerToken: config.TWITTER.APP_BEARER_TOKEN,
  },
  [TwitterBotName.ContestBot]: {
    name: TwitterBotName.ContestBot,
    // TODO: update
    username: 'contestbot',
    twitterUserId: '1338',
    bearerToken: config.TWITTER.APP_BEARER_TOKEN,
  },
  [TwitterBotName.Common]: {
    name: TwitterBotName.Common,
    username: 'commondotxyz',
    twitterUserId: '1005075721553932288',
    bearerToken: config.TWITTER.APP_BEARER_TOKEN,
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
    }>
  | Array<{
      event_name: 'TwitterCommonMentioned';
      event_payload: z.infer<typeof events.TwitterCommonMentioned>;
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
    } else if (
      twitterBotConfig.twitterUserId === TwitterBotConfigs.MomBot.twitterUserId
    ) {
      return {
        event_name: 'TwitterMomBotMentioned',
        event_payload: t,
      };
    } else {
      return {
        event_name: 'TwitterCommonMentioned',
        event_payload: t,
      };
    }
  }) as twitterMentions;
}
