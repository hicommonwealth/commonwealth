import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function GetCommunitySelectedTagsAndCommunities(): Query<
  typeof schemas.GetCommunitySelectedTagsAndCommunities
> {
  return {
    ...schemas.GetCommunitySelectedTagsAndCommunities,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      type QueryResult = {
        id: string;
        community: string;
        lifetime_thread_count: number;
        profile_count: number;
        icon_url?: string;
        description?: string;
        namespace?: string;
        chain_node_id?: number;
        tag_names?: string[];
        selected_community_ids?: string[];
      };

      const result = await models.sequelize.query<QueryResult>(
        `
        WITH community_tags AS (
          SELECT 
            d.community_id,
            array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names,
            array_agg(DISTINCT d.selected_community_id) FILTER (WHERE d.selected_community_id IS NOT NULL) as selected_community_ids
          FROM "CommunityDirectoryTags" d
          LEFT JOIN "Tags" t ON d.tag_id = t.id
          WHERE d.community_id = :community_id
          GROUP BY d.community_id
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
          COALESCE(ct.tag_names, '{}') as tag_names,
          COALESCE(ct.selected_community_ids, '{}') as selected_community_ids
        FROM "Communities" c
        LEFT JOIN community_tags ct ON c.id = ct.community_id
        WHERE c.id = :community_id
        ORDER BY c.profile_count DESC;
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { community_id: payload.community_id },
        },
      );

      return result.map((item: QueryResult) => ({
        ...item,
        tag_names: item.tag_names || [],
        selected_community_ids: item.selected_community_ids || [],
      }));
    },
  };
}
