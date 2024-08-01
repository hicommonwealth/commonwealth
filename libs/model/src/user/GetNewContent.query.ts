import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op, QueryTypes } from 'sequelize';
import { models, sequelize } from '../database';

export function GetNewContent(): Query<typeof schemas.GetNewContent> {
  return {
    ...schemas.GetNewContent,
    auth: [],
    body: async ({ actor }) => {
      const joinedCommunityIdsWithNewContent: string[] = [];

      // get addresses for auth user
      const addresses = await models.Address.findAll({
        where: {
          user_id: actor.user.id!,
          verified: { [Op.not]: null },
          last_active: { [Op.not]: null },
        },
      });

      // find if there is new content for each community per user address
      for (let i = 0; i < addresses.length; i++) {
        const { community_id, last_active } = addresses[i];

        // goto next address if current community address is already in content array
        if (
          !community_id ||
          !last_active ||
          joinedCommunityIdsWithNewContent.includes(community_id)
        ) {
          continue;
        }

        // get counts of threads and comments for current community address
        const response = await sequelize.query<{ count: string }>(
          `
            SELECT (
              (
                SELECT COUNT(*) 
                  FROM "Threads" 
                  WHERE "community_id" = :community_id 
                  AND "created_at" > :last_active 
                  AND "deleted_at" IS NULL
              )
              +
              (
                SELECT COUNT(*) 
                FROM "Comments" 
                WHERE "community_id" = :community_id 
                AND "created_at" > :last_active 
                AND "deleted_at" IS NULL
              )
            ) AS count;
          `,
          {
            raw: true,
            type: QueryTypes.SELECT,
            replacements: {
              community_id,
              last_active: new Date(last_active)?.toISOString(),
            },
          },
        );
        const count = parseInt(response[0].count); // query returns `count` as a string, convert it to int

        // only add community id's to new content array
        if (count > 0) joinedCommunityIdsWithNewContent.push(community_id);
      }

      return { joinedCommunityIdsWithNewContent };
    },
  };
}
