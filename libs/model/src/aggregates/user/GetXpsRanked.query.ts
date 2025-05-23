import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

type RankedUser = z.infer<typeof schemas.XpRankedUser>;

/**
 * Returns the top users with the most XP points.
 * @param top The number of top users to return.
 * @param quest_id The quest ID to filter the users by.
 */
export function GetXpsRanked(): Query<typeof schemas.GetXpsRanked> {
  return {
    ...schemas.GetXpsRanked,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { top, quest_id } = payload;
      const query = quest_id
        ? `
with top_users as (
	select
		l.user_id,
		sum(l.xp_points)::int + sum(coalesce(l.creator_xp_points, 0))::int as xp_points
	from "XpLogs" l
		join "QuestActionMetas" m on l.action_meta_id = m.id
		join "Quests" q on m.quest_id = q.id
	  join "Users" u on l.user_id = u.id 
	where q.id = :quest_id AND u.tier != ${UserTierMap.BannedUser}
	group by user_id
	order by 2 desc
	limit :top
)
select
 	top_users.*,
 	u.tier,
 	u.profile->>'name' as user_name,
 	u.profile->>'avatar_url' as avatar_url
from
	top_users
	join "Users" u on top_users.user_id = u.id;
`
        : `
select
 	id as user_id,
 	coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) as xp_points,
 	tier,
 	profile->>'name' as user_name,
 	profile->>'avatar_url' as avatar_url
from
	"Users" U
where tier != ${UserTierMap.BannedUser}
order by xp_points desc
limit :top;
`;
      return await models.sequelize.query<RankedUser>(query, {
        replacements: quest_id ? { quest_id, top } : { top },
        type: QueryTypes.SELECT,
        raw: true,
      });
    },
  };
}
