import { TwitterBotName } from '@hicommonwealth/shared';
import { config } from '../../config';

export const TwitterBotConfigs = {
  [TwitterBotName.MomBot]: {
    name: TwitterBotName.MomBot,
    // TODO: update
    username: 'mombot',
    twitterUserId: '1337',
    bearerToken: config.TWITTER.APP_BEARER_TOKEN,
    consumerKey: config.TWITTER.CONSUMER_KEY,
    consumerSecret: config.TWITTER.CONSUMER_SECRET,
    accessToken: config.TWITTER.ACCESS_TOKEN,
    accessTokenSecret: config.TWITTER.ACCESS_TOKEN_SECRET,
  },
  [TwitterBotName.ContestBot]: {
    name: TwitterBotName.ContestBot,
    // TODO: update
    username: 'contestbot',
    twitterUserId: '1338',
    bearerToken: config.TWITTER.APP_BEARER_TOKEN,
    consumerKey: config.TWITTER.CONSUMER_KEY,
    consumerSecret: config.TWITTER.CONSUMER_SECRET,
    accessToken: config.TWITTER.ACCESS_TOKEN,
    accessTokenSecret: config.TWITTER.ACCESS_TOKEN_SECRET,
  },
  [TwitterBotName.Common]: {
    name: TwitterBotName.Common,
    username: 'commondotxyz',
    twitterUserId: '1005075721553932288',
    bearerToken: config.TWITTER.APP_BEARER_TOKEN,
    consumerKey: config.TWITTER.CONSUMER_KEY,
    consumerSecret: config.TWITTER.CONSUMER_SECRET,
    accessToken: config.TWITTER.ACCESS_TOKEN,
    accessTokenSecret: config.TWITTER.ACCESS_TOKEN_SECRET,
  },
  [TwitterBotName.CreateOnCommon]: {
    name: TwitterBotName.CreateOnCommon,
    username: 'createoncommon',
    twitterUserId: '1917306353711996932',
    bearerToken: config.TWITTER.APP_BEARER_TOKEN,
    consumerKey: config.TWITTER.CONSUMER_KEY,
    consumerSecret: config.TWITTER.CONSUMER_SECRET,
    accessToken: config.TWITTER.ACCESS_TOKEN,
    accessTokenSecret: config.TWITTER.ACCESS_TOKEN_SECRET,
  },
} as const;
