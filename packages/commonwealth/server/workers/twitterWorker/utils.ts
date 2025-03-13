import {
  TwitterBotConfig,
  TwitterBotConfigs,
  twitterMentions,
} from '@hicommonwealth/model';
import { Tweet } from '@hicommonwealth/schemas';
import { z } from 'zod';

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
