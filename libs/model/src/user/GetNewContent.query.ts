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
          WITH CommunityContentContent AS (
            SELECT 
              a.community_id,
              (
                (
                  SELECT 
                    COUNT(*) 
                  FROM 
                    "Threads" 
                  WHERE 
                    "community_id" = a.community_id 
                    AND "created_at" > a.last_active 
                    AND "deleted_at" IS NULL
                )
                +
                (
                  SELECT 
                    COUNT(*) 
                  FROM 
                    "Comments" 
                  WHERE 
                    "community_id" = a.community_id 
                    AND "created_at" > a.last_active 
                    AND "deleted_at" IS NULL
                )
              ) AS content_content
            FROM 
              "Addresses" a
            WHERE 
              a.verified IS NOT NULL 
              AND a.last_active IS NOT NULL 
              AND a.user_id = :user_id
          )
          SELECT
            community_id
          FROM 
            CommunityContentContent
          WHERE
            content_content > 0;
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
