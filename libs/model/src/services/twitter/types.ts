import { events } from '@hicommonwealth/schemas';
import { z } from 'zod/v4';
import { TwitterBotConfigs } from './twitter.config';

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

type AllKeys<T> = T extends unknown ? keyof T : never;

type RequiredFromUnion<T> = {
  [P in AllKeys<T>]-?: NonNullable<
    T extends unknown ? (P extends keyof T ? T[P] : never) : never
  >;
};

export type RequiredTwitterBotConfig = RequiredFromUnion<TwitterBotConfig>;
