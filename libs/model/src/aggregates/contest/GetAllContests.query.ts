import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetAllContests(): Query<typeof schemas.GetAllContests> {
  return {
    ...schemas.GetAllContests,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const whereConditions = [
        payload.community_id ? 'cm.community_id = :community_id' : '',
        payload.contest_address ? 'cm.contest_address = :contest_address' : '',
        payload.search ? 'cm.name ILIKE :search' : '',
      ]
        .filter(Boolean)
        .join(' and ');

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
  cm.description,
  cm.funding_token_address,
  cm.prize_percentage,
  cm.payout_structure,
  cm.cancelled,
  cm.topic_id,
  cm.is_farcaster_contest,
  cm.vote_weight_multiplier,
  cm.namespace_judge_token_id,
  cm.namespace_judges,
  coalesce((
    select jsonb_agg(json_build_object('id', t.id, 'name', t.name) order by t.name)
    from "ContestManagers" cm2
    left join "Topics" t on cm2.topic_id = t.id
    WHERE cm2.contest_address = cm.contest_address
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
      'score', c.score,
      'contest_balance', c.contest_balance::text --,
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
  where cm.deleted_at is null ${whereConditions.length > 0 ? ' and ' : ''}
  ${whereConditions}
group by
  cm.community_id,
  cm.contest_address,
  cm.interval,
  cm.ticker,
  cm.decimals,
  cm.created_at,
  cm.name,
  cm.topic_id,
  cm.is_farcaster_contest,
  cm.vote_weight_multiplier,
  cm.image_url,
  cm.description,
  cm.funding_token_address,
  cm.prize_percentage,
  cm.payout_structure,
  cm.cancelled,
  cm.namespace_judge_token_id,
  cm.namespace_judges,
  c.contests
order by
  cm.name;
`,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: {
            community_id: payload.community_id,
            contest_address: payload.contest_address,
            ...(payload.search && { search: `%${payload.search}%` }),
          },
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
