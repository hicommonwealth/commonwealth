import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../database';

export function GetNewContent(): Query<typeof schemas.GetNewContent> {
  return {
    ...schemas.GetNewContent,
    auth: [],
    body: async ({ actor }) => {
      const joinedCommunityIdsWithNewContent: string[] = [];

      // get ids of communities where user has membership and that community got new threads/comments
      // since user's last active session per address (the address that user used to join that community)
      const response = await sequelize.query<{ community_id: string }>(
        `
          SELECT 
            a.community_id
          FROM 
            "Addresses" a
          LEFT JOIN "Threads" t
            ON t.community_id = a.community_id 
            AND t.created_at > a.last_active 
            AND t.deleted_at IS NULL
          LEFT JOIN "Comments" c 
            ON c.community_id = a.community_id 
            AND c.created_at > a.last_active 
            AND c.deleted_at IS NULL
          WHERE 
            a.verified IS NOT NULL 
            AND a.last_active IS NOT NULL 
            AND a.user_id = :user_id
          GROUP BY 
            a.community_id
          HAVING  
            COUNT(t.id) + COUNT(c.id) > 0;
        `,
        {
          raw: true,
          type: QueryTypes.SELECT,
          replacements: {
            user_id: actor.user.id!,
          },
        },
      );

      // add unique community ids to content array
      joinedCommunityIdsWithNewContent.push(
        ...new Set(response.map((x) => x.community_id)),
      );

      return { joinedCommunityIdsWithNewContent };
    },
  };
}
