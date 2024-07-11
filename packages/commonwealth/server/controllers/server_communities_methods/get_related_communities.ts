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
  return await sequelize.query(
    `
      SELECT c.id, c.icon_url, c.name as community, c.description,
      c.thread_count, c.address_count, c.namespace, c.chain_node_id
      FROM "ChainNodes" as cn 
      JOIN "Communities" as c on c.chain_node_id = cn.id
      WHERE cn.id = :chainNodeId AND t.deleted_at IS NULL and c.active = true
      GROUP BY c.id
      ORDER BY c.address_count DESC;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { chainNodeId },
    },
  );
}
