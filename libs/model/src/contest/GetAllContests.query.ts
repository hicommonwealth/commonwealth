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
      const results = await models.sequelize.query<
        z.infer<typeof schemas.ContestResults>
      >(
        `
select
  cm.community_id,
  cm.contest_address,
  cm.interval,
  cm.ticker,
  cm.decimals,
  cm.created_at,
  cm.name,
  cm.image_url,
  cm.funding_token_address,
  cm.prize_percentage,
  cm.payout_structure,
  cm.cancelled,
  coalesce((
    select jsonb_agg(json_build_object('id', t.id, 'name', t.name) order by t.name)
    from "ContestTopics" ct
    left join "Topics" t on ct.topic_id = t.id
    where cm.contest_address = ct.contest_address
  ), '[]'::jsonb) as topics,
  coalesce(c.contests, '[]'::jsonb) as contests
from
"ContestManagers" cm left join (
	select
	  c.contest_address,
    jsonb_agg(json_build_object(
      'contest_id', c.contest_id,
      'start_time', c.start_time,
      'end_time', c.end_time,
      'score_updated_at', c.score_updated_at,
      'score', c.score --,
--      'actions', coalesce(ca.actions, '[]'::jsonb)
		) order by c.contest_id desc) as contests
	from "Contests" c
--    left join (
--      select
--        a.contest_id,
--        jsonb_agg(jsonb_build_object(
--          'content_id', a.content_id,
--          'actor_address', a.actor_address,
--          'action', a.action,
--          'content_url', a.content_url,
--          'thread_id', a.thread_id,
--          'thread_title', tr.title,
--          'voting_power', a.voting_power,
--          'created_at', a.created_at
--        ) order by a.created_at) as actions
--      from "ContestActions" a left join "Threads" tr on a.thread_id = tr.id
--      group by a.contest_id
--    ) as ca on c.contest_id = ca.contest_id
    ${payload.contest_id ? `where c.contest_id = ${payload.contest_id}` : ''}
	  group by c.contest_address
  ) as c on cm.contest_address = c.contest_address
where
  cm.community_id = :community_id
  ${
    payload.contest_address
      ? `and cm.contest_address = '${payload.contest_address}'`
      : ''
  }
group by
  cm.community_id,
  cm.contest_address,
  cm.interval,
  cm.ticker,
  cm.decimals,
  cm.created_at,
  cm.name,
  cm.image_url,
  cm.funding_token_address,
  cm.prize_percentage,
  cm.payout_structure,
  cm.cancelled,
  c.contests
order by
  cm.name;
`,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: { community_id: payload.community_id },
        },
      );
      results.forEach((r) =>
        r.contests.forEach((c) => {
          c.score?.forEach((w) => {
            w.tickerPrize = Number(w.prize) / 10 ** r.decimals;
            console.log(w.votes, typeof w.votes);
          });
          c.start_time = new Date(c.start_time);
          c.end_time = new Date(c.end_time);
          c.score_updated_at =
            c.score_updated_at && new Date(c.score_updated_at);
          // c.actions.forEach((a) => (a.created_at = new Date(a.created_at)));
        }),
      );

      return results;
    },
  };
}
