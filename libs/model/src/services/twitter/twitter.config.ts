import { TwitterBotName } from '@hicommonwealth/shared';
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
