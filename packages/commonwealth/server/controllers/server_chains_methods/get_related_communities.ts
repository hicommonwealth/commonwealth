import { QueryTypes } from 'sequelize';
import { sequelize } from '../../database';
import { ServerChainsController } from '../server_chains_controller';

/**
 * Options for the getRelatedCommunities function.
 *
 * @typedef {Object} GetRelatedCommunitiesOptions
 * @property {string} chainNodeId - The id of the ChainNode variable for filtering.
 */
export type GetRelatedCommunitiesOptions = { chainNodeId: number };

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
}[];

export async function __getRelatedCommunities(
  this: ServerChainsController,
  { chainNodeId }: GetRelatedCommunitiesOptions
): Promise<GetRelatedCommunitiesResult> {
  // Although this subquery is not necessary as is currently, We should keep it because in the future if we want to
  // paginate, then we will need to paginate through the subquery.
  return await sequelize.query(
    `
    SELECT 
        popular_chains.id as id, 
        popular_chains.name as community, 
        popular_chains.icon_url, 
        popular_chains.thread_count, 
        COUNT(a) as address_count 
    FROM 
        (SELECT c.id, c.icon_url, c.name, COUNT(t) as thread_count 
        FROM "ChainNodes" as cn 
        JOIN "Chains" as c on c.chain_node_id = cn.id 
        LEFT JOIN "Threads" as t on t.chain = c.id 
        WHERE cn.id = :chainNodeId 
        GROUP BY c.id) as popular_chains 
    LEFT JOIN "Addresses" as a on a.chain = popular_chains.id 
    GROUP BY popular_chains.id, popular_chains.icon_url, popular_chains.name, popular_chains.thread_count 
    ORDER BY address_count DESC;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { chainNodeId }
    }
  );
}