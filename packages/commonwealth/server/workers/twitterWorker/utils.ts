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
