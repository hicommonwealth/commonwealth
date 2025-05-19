import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function GetRelatedCommunities(): Query<
  typeof schemas.GetRelatedCommunities
> {
  return {
    ...schemas.GetRelatedCommunities,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { chain_node_id } = payload;

      return await models.sequelize.query(
        `
        WITH community_tags AS (
          SELECT 
            ct.community_id,
            array_agg(t.name) as tag_ids
          FROM 
            "CommunityTags" ct
            JOIN "Tags" t ON ct.tag_id = t.id
          GROUP BY
            ct.community_id
        )
        SELECT 
          c.id,
          c.icon_url,
          c.name as community,
          c.description,
          c.lifetime_thread_count,
          c.profile_count,
          c.namespace,
          c.chain_node_id,
          COALESCE(ct.tag_ids, '{}') as tag_ids
        FROM 
          "Communities" as c
          LEFT JOIN community_tags ct ON c.id = ct.community_id
        WHERE 
          c.active = true
          AND c.chain_node_id = :chain_node_id
        ORDER BY 
          c.profile_count DESC;
    `,
        {
          type: QueryTypes.SELECT,
          replacements: { chain_node_id },
        },
      );
    },
  };
}
