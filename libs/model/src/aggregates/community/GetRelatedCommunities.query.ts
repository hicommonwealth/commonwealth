/*
import {
  GetRelatedCommunitiesQuery,
  GetRelatedCommunitiesResult
} from '../../controllers/server_communities_methods/get_related_communities';
import { ServerControllers } from '../../routing/router';
import { success, TypedRequestQuery, TypedResponse } from '../../types';

type GetRelatedCommunitiesParams = GetRelatedCommunitiesQuery;
type GetRelatedCommunitiesResponse = GetRelatedCommunitiesResult;

export const getRelatedCommunitiesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetRelatedCommunitiesParams>,
  res: TypedResponse<GetRelatedCommunitiesResponse>
) => {
  const { chainNodeId } = req.query;
  const results = await controllers.communities.getRelatedCommunities({ chainNodeId });
  return success(res, results);
};
*/

/*
import { sequelize } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';

 
export type GetRelatedCommunitiesQuery = { chainNodeId: number };

 
export type GetRelatedCommunitiesResult = {
  id: string;
  community: string;
  icon_url: string;
  lifetime_thread_count: number;
  profile_count: number;
  description: string;
  namespace: string;
  chain_node_id: number;
  tag_ids: string[];
}[];

export async function __getRelatedCommunities(
  this: ServerCommunitiesController,
  { chainNodeId }: GetRelatedCommunitiesQuery,
): Promise<GetRelatedCommunitiesResult> {
  return await sequelize.query(
    `
        WITH community_tags AS (
          SELECT 
            ct.community_id,
            array_agg(t.name) as tag_ids
          FROM "CommunityTags" ct
          JOIN "Tags" t ON ct.tag_id = t.id
          GROUP BY ct.community_id
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
        FROM "Communities" as c
        LEFT JOIN community_tags ct ON c.id = ct.community_id
        WHERE c.active = true
          AND c.chain_node_id = :chainNodeId
        ORDER BY c.profile_count DESC;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { chainNodeId },
    },
  );
}

*/
