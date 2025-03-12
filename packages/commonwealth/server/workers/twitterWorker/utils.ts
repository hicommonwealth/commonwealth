import { models } from '@hicommonwealth/model';
import { events, Tweet } from '@hicommonwealth/schemas';
import { TwitterBotName } from '@hicommonwealth/shared';
import { QueryTypes, Transaction } from 'sequelize';
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

export async function pgMultiRowUpdate(
  tableName: string,
  columns: {
    setColumn: string;
    rows: { newValue: string | number; whenCaseValue: string | number }[];
  }[],
  caseColumn: string,
  transaction?: Transaction,
) {
  if (columns.length === 0) return false;

  let updates = ``;
  for (const { setColumn, rows } of columns) {
    if (updates.length > 0) updates += `, \n`;
    updates += `${setColumn} = CASE \n${rows
      .map(
        ({ whenCaseValue, newValue }) =>
          `WHEN ${caseColumn} = ${whenCaseValue} THEN ${newValue}`,
      )
      .join('\n')}`;
    updates += ` \nEND`;
  }

  const caseValues = new Set(
    columns.map((c) => c.rows.map((r) => r.whenCaseValue)).flat(),
  );
  const query = `
      UPDATE "${tableName}"
      SET ${updates}
      WHERE ${caseColumn} IN (${Array.from(caseValues).join(', ')});
  `;

  await models.sequelize.query(query, { transaction, type: QueryTypes.UPDATE });
  return true;
}
