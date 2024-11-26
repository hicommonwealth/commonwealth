import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetAllContests(): Query<typeof schemas.GetAllContests> {
  return {
    ...schemas.GetAllContests,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const whereConditions = [];
      const replacements: Record<string, any> = {};

      if (payload.community_id) {
        whereConditions.push('cm.community_id = :community_id');
        replacements.community_id = payload.community_id;
      }

      if (payload.contest_address) {
        whereConditions.push('cm.contest_address = :contest_address');
        replacements.contest_address = payload.contest_address;
      }

      if (payload.contest_id) {
        whereConditions.push(
          'exists (select 1 from "Contests" c2 where c2.contest_address = cm.contest_address and c2.contest_id = :contest_id)',
        );
        replacements.contest_id = payload.contest_id;
      }

      const whereClause =
        whereConditions.length > 0
          ? 'WHERE ' + whereConditions.join(' AND ')
          : '';

      const results = await models.sequelize.query<
        z.infer<typeof schemas.ContestResults>
      >(
        `
WITH contest_data AS (
  SELECT
    c.contest_address,
    jsonb_agg(json_build_object(
      'contest_id', c.contest_id,
      'start_time', c.start_time,
      'end_time', c.end_time,
      'score_updated_at', c.score_updated_at,
      'score', c.score
    ) ORDER BY c.contest_id DESC) AS contests
  FROM "Contests" c
  GROUP BY c.contest_address
)
SELECT
  cm.community_id,
  cm.contest_address,
  cm.interval,
  cm.ticker,
  cm.decimals,
  cm.created_at,
  cm.name,
  cm.image_url,
  cm.description,
  cm.funding_token_address,
  cm.prize_percentage,
  cm.payout_structure,
  cm.cancelled,
  cm.topic_id,
  cm.is_farcaster_contest,
  COALESCE((
    SELECT jsonb_agg(json_build_object('id', t.id, 'name', t.name) ORDER BY t.name)
    FROM "ContestManagers" cm2
    LEFT JOIN "Topics" t ON cm2.topic_id = t.id
    WHERE cm2.contest_address = cm.contest_address
  ), '[]'::jsonb) AS topics,
  COALESCE(cd.contests, '[]'::jsonb) AS contests
FROM 
  "ContestManagers" cm
LEFT JOIN 
  contest_data cd ON cm.contest_address = cd.contest_address
${whereClause}
ORDER BY 
  cm.name;
`,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements,
        },
      );
      results.forEach((r) => {
        r.contests.forEach((c) => {
          c.score?.forEach((w) => {
            w.tickerPrize = Number(w.prize) / 10 ** r.decimals;
          });
          c.start_time = new Date(c.start_time);
          c.end_time = new Date(c.end_time);
          c.score_updated_at =
            c.score_updated_at && new Date(c.score_updated_at);
          // c.actions.forEach((a) => (a.created_at = new Date(a.created_at)));
        });
        r.topics = r.topics.filter((t) => !!t.id);
      });

      return results;
    },
  };
}
