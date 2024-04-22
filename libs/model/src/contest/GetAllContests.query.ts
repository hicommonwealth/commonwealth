import { Query, schemas } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export const GetAllContests: Query<
  typeof schemas.queries.GetAllContests
> = () => ({
  ...schemas.queries.GetAllContests,
  auth: [],
  body: async ({ payload }) => {
    const results = await models.sequelize.query<
      z.infer<typeof schemas.queries.ContestResults>
    >(
      `
select 
    cm.community_id,
  	cm.contest_address,
    cm.interval,
    cm.created_at,
  	cm.name,
    cm.image_url,
    cm.funding_token_address,
    cm.prize_percentage,
    cm.payout_structure,
    cm.paused,
  	coalesce((select jsonb_agg(json_build_object('id', t.id, 'name', t.name))
      from "ContestTopics" ct left join "Topics" t on ct.topic_id = t.id
      where cm.contest_address = ct.contest_address
    ), '[]'::jsonb) as topics,
  	coalesce(jsonb_agg(json_build_object(
      'contest_id', c.contest_id, 
      'start_time', c.start_time, 
      'end_time', c.end_time,
      'winners', c.winners,
      'actions', (
        select jsonb_agg(jsonb_build_object(
          'content_id', a.content_id,
          'actor_address', a.actor_address,
          'action', a.action,
          'content_url', a.content_url,
          'thread_id', a.thread_id,
          'thread_title', tr.title,
          'voting_power', a.voting_power,
          'created_at', a.created_at
        )) as actions 
        from "ContestActions" a left join "Threads" tr on a.thread_id = tr.id
        where c.contest_address = a.contest_address and c.contest_id = a.contest_id
      )
    )), '[]'::jsonb) as contests
from 
  "ContestManagers" cm
  left join "Contests" c on cm.contest_address = c.contest_address
where
  cm.community_id = :community_id
  and c.contest_id = coalesce(:contest_id, c.contest_id)
group by
    cm.community_id,
  	cm.contest_address,
    cm.interval,
    cm.created_at,
  	cm.name,
    cm.image_url,
    cm.funding_token_address,
    cm.prize_percentage,
    cm.payout_structure,
    cm.paused
order by
  cm.name 
`,
      {
        type: QueryTypes.SELECT,
        raw: true,
        replacements: { contest_id: null, ...payload },
      },
    );
    // TODO: is there another way to revive JSON dates?
    results.forEach((r) =>
      r.contests.forEach((c) => {
        c.start_time = new Date(c.start_time);
        c.end_time = new Date(c.end_time);
        c.actions.forEach((a) => (a.created_at = new Date(a.created_at)));
      }),
    );
    return results;
  },
});
