import { Query } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export const GetUserCommunitiesSchema = {
  input: z.object({
    userId: z.number(),
  }),
  output: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      iconUrl: z.string(),
      isStarred: z.boolean().default(false),
    }),
  ),
};

export function GetUserCommunities(): Query<typeof GetUserCommunitiesSchema> {
  return {
    ...GetUserCommunitiesSchema,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { userId } = payload;

      const communities = await models.sequelize.query<{
        id: string;
        name: string;
        icon_url: string | null;
        starred_at: string | null;
      }>(
        `
        SELECT DISTINCT
          c.id, c.name, c.icon_url,
          sc.updated_at as starred_at,
          c.created_at
        FROM
          "Communities" c
          JOIN "Addresses" a ON c.id = a.community_id and a.user_id = :user_id AND a.verified IS NOT NULL
          LEFT JOIN "StarredCommunities" sc ON c.id = sc.community_id AND sc.user_id = :user_id
        WHERE
          c.active = true AND c.tier != 0
        ORDER BY
          sc.updated_at DESC NULLS LAST,
          c.created_at DESC;
        `,
        {
          replacements: { user_id: userId },
          type: QueryTypes.SELECT,
        },
      );

      return communities.map((community) => ({
        id: community.id,
        name: community.name,
        iconUrl: community.icon_url || '',
        isStarred: !!community.starred_at,
      }));
    },
  };
}
