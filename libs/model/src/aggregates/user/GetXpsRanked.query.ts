import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { getQuestXpLeaderboardViewName } from '../../utils/quests';

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
      const {
        limit = 10,
        cursor = 1,
        quest_id,
        search = '',
        user_id,
      } = payload;
      const searchParam = search ? `%${search}%` : '';

      // by default this excludes incomplete or banned users
      // since the materialized view only projects users with tier > 1
      const baseQuery = `
        WITH full_ranking as (select l.user_id,
                                     l.xp_points,
                                     l.tier,
                                     l.rank,
                                     U.profile ->> 'name'       as user_name,
                                     U.profile ->> 'avatar_url' as avatar_url
                              from ${quest_id ? `"${getQuestXpLeaderboardViewName(quest_id)}"` : 'user_leaderboard'} l
                                     join "Users" U on U.id = l.user_id
                                ${search ? `WHERE u.profile->>'name' ILIKE $search` : ''})
        select *
        from full_ranking
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

      const countSql = `SELECT COUNT(*)
                        FROM (${baseQuery}) as count_table`;

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
