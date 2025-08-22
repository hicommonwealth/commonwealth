import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

type RankedUser = z.infer<typeof schemas.XpRankedUser>;

/**
 * Returns the top users with the most XP points.
 * @param limit The number of users to return per page.
 * @param cursor The page number.
 * @param quest_id The quest ID to filter the users by.
 * @param search The search term to filter users by name.
 * @param user_id Get XP ranking for a specific user.
 */
export function GetXpsRanked(): Query<typeof schemas.GetXpsRanked> {
  return {
    ...schemas.GetXpsRanked,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { limit = 10, cursor = 1, quest_id, search = '', user_id } = payload;
      const searchCondition = search
        ? `AND LOWER(u.profile->>'name') LIKE LOWER($search)`
        : '';
      const searchParam = search ? `%${search}%` : '';

      const baseQuery = quest_id
        ? `
with
as_user as (
	select
		l.user_id,
		sum(l.xp_points)::int as xp_points
	from
		"XpLogs" l
		join "QuestActionMetas" m on l.action_meta_id = m.id
		join "Quests" q on m.quest_id = q.id
	  join "Users" u on l.user_id = u.id 
	where
		q.id = $quest_id
		AND u.tier != ${UserTierMap.BannedUser}
	group by
		l.user_id
),
as_creator as (
	select
		l.creator_user_id as user_id,
		sum(l.creator_xp_points)::int as xp_points
	from
		"XpLogs" l
		join "QuestActionMetas" m on l.action_meta_id = m.id
		join "Quests" q on m.quest_id = q.id
	  join "Users" u on l.creator_user_id = u.id 
	where
		q.id = $quest_id
		AND u.tier != ${UserTierMap.BannedUser}
	group by
		l.creator_user_id
),
ranked_users as (
	select
		coalesce(u.user_id, c.user_id) as user_id,
		coalesce(u.xp_points, 0) + coalesce(c.xp_points, 0) as xp_points
	from
		as_user u
		full outer join as_creator c on u.user_id = c.user_id
),
full_ranking as (
	select
		r.user_id,
		r.xp_points,
		u.tier,
		u.profile->>'name' as user_name,
		u.profile->>'avatar_url' as avatar_url,
		(ROW_NUMBER() OVER (ORDER BY r.xp_points DESC, r.user_id ASC))::int as rank
	from
		ranked_users r
		join "Users" u on r.user_id = u.id
	where 1=1 ${search ? `AND LOWER(u.profile->>'name') LIKE LOWER($search)` : ''}
)
select * from full_ranking
`
        : `
with full_ranking as (
	select
		id as user_id,
		coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) as xp_points,
		tier,
		profile->>'name' as user_name,
		profile->>'avatar_url' as avatar_url,
		(ROW_NUMBER() OVER (ORDER BY coalesce(xp_points, 0) + coalesce(xp_referrer_points, 0) DESC, id ASC))::int as rank
	from
		"Users" U
	where tier != ${UserTierMap.BannedUser} ${searchCondition}
)
select * from full_ranking
`;

      // If user_id is provided, we need to get the user's rank from the full dataset
      if (user_id) {
        const userQuery = `${baseQuery} where user_id = $user_id`;
        const userResult = await models.sequelize.query<RankedUser>(userQuery, {
          bind: { quest_id, search: searchParam, user_id },
          type: QueryTypes.SELECT,
          raw: true,
        });

        // Return single result as paginated response
        return schemas.buildPaginatedResponse(userResult, userResult.length, {
          limit: 1,
          cursor: 1,
        });
      }

      const { sql: paginationSql, bind: paginationBind } =
        schemas.buildPaginationSql({
          limit: Math.min(limit, 100),
          page: cursor,
          orderBy: 'rank',
          orderDirection: 'ASC',
        });

      const paginatedSql = `${baseQuery} ${paginationSql}`;
      const bind = quest_id
        ? { quest_id, search: searchParam, ...paginationBind }
        : { search: searchParam, ...paginationBind };

      const countSql = `SELECT COUNT(*) FROM (${baseQuery}) as count_table`;

      const [results, [{ count }]] = await Promise.all([
        models.sequelize.query<RankedUser>(paginatedSql, {
          bind,
          type: QueryTypes.SELECT,
          raw: true,
        }),
        models.sequelize.query<{ count: string }>(countSql, {
          bind,
          type: QueryTypes.SELECT,
          raw: true,
        }),
      ]);

      return schemas.buildPaginatedResponse(results, parseInt(count, 10), {
        limit: paginationBind.limit,
        cursor,
        offset: limit * (cursor - 1),
      });
    },
  };
}
