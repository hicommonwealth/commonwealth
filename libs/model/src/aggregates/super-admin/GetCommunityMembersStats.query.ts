import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

export function GetCommunityMembersStats(): Query<
  typeof schemas.GetCommunityMembersStats
> {
  return {
    ...schemas.GetCommunityMembersStats,
    auth: [isSuperAdmin],
    secure: false,
    body: async ({ payload }) => {
      const { community_id } = payload;

      const members = await models.sequelize.query<
        z.infer<typeof schemas.MembersStatsView>
      >(
        `
      WITH A AS (
        SELECT
          a.id, 
          a.address, 
          u.profile->>'name' AS profile_name 
        FROM 
          "Addresses" a
          LEFT JOIN "Users" u ON a.user_id = u.id
        WHERE 
          a.community_id = :communit_id
      ),
      T AS (SELECT id, address_id from "Threads" where community_id = :community_id)
      SELECT 
        A.address, 
        A.profile_name, 
        COUNT(DISTINCT T.id) AS thread_count,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT tr.id) + COUNT(DISTINCT cr.id) AS reaction_count
      FROM 
        A
        LEFT JOIN T ON A.id = T.address_id
        LEFT JOIN "Comments" c ON A.id = c.address_id AND T.id = c.thread_id 
        LEFT JOIN "Reactions" tr ON A.id = tr.address_id AND T.id = tr.thread_id 
        LEFT JOIN "Reactions" cr ON A.id = cr.address_id 
        LEFT JOIN "Comments" crc ON cr.comment_id = crc.id AND T.id =crc.thread_id 
      GROUP BY 
        A.address,
        A.profile_name;
          `,
        {
          replacements: { community_id },
          type: QueryTypes.SELECT,
        },
      );
      return { members };
    },
  };
}
