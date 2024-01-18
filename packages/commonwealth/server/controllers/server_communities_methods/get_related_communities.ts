import { sequelize } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';

/**
 * Options for the getRelatedCommunities function.
 *
 * @typedef {Object} GetRelatedCommunitiesQuery
 * @property {string} chainNodeId - The id of the ChainNode variable for filtering.
 */
export type GetRelatedCommunitiesQuery = { chainNodeId: number };

/**
 * Response for the getRelatedCommunities function.
 *
 * @typedef {Object} GetRelatedCommunitiesResult
 * @property {string} id - The id of the community
 * @property {string} community - The name of the community
 * @property {string} icon_url - The icon url of the community
 * @property {number} thread_count - The Number of threads associated with the community
 * @property {number} address_count - The Number of addresses associated with the community
 */
export type GetRelatedCommunitiesResult = {
  id: string;
  community: string;
  icon_url: string;
  thread_count: number;
  address_count: number;
  description: string;
}[];

export async function __getRelatedCommunities(
  this: ServerCommunitiesController,
  { chainNodeId }: GetRelatedCommunitiesQuery,
): Promise<GetRelatedCommunitiesResult> {
  // Although this subquery is not necessary as is currently, We should keep it because in the future if we want to
  // paginate, then we will need to paginate through the subquery.
  return await sequelize.query(
    `
    SELECT 
        popular_communities.id as id, 
        popular_communities.name as community, 
        popular_communities.description as description,
        popular_communities.icon_url, 
        popular_communities.thread_count, 
        COUNT(a) as address_count 
    FROM 
        (SELECT c.id, c.icon_url, c.name, c.description, COUNT(t) as thread_count 
        FROM "ChainNodes" as cn 
        JOIN "Communities" as c on c.chain_node_id = cn.id 
        LEFT JOIN "Threads" as t on t.community_id = c.id 
        WHERE cn.id = :chainNodeId and t.deleted_at IS NULL
        GROUP BY c.id) as popular_communities 
    LEFT JOIN "Addresses" as a on a.community_id = popular_communities.id 
    GROUP BY popular_communities.id, popular_communities.icon_url, popular_communities.name,
     popular_communities.description, popular_communities.thread_count 
    ORDER BY address_count DESC;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { chainNodeId },
    },
  );
}
