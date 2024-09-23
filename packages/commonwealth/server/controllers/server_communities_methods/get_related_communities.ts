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
 * @property {number} lifetime_thread_count - The Number of threads associated with the community
 * @property {number} profile_count - The Number of profiles with an address belonging to the community
 */
export type GetRelatedCommunitiesResult = {
  id: string;
  community: string;
  icon_url: string;
  lifetime_thread_count: number;
  profile_count: number;
  description: string;
}[];

export async function __getRelatedCommunities(
  this: ServerCommunitiesController,
  { chainNodeId }: GetRelatedCommunitiesQuery,
): Promise<GetRelatedCommunitiesResult> {
  return await sequelize.query(
    `
        SELECT c.id,
               c.icon_url,
               c.name as community,
               c.description,
               c.lifetime_thread_count,
               c.profile_count,
               c.namespace,
               c.chain_node_id
        FROM "Communities" as c
        WHERE c.active = true
          AND C.chain_node_id = :chainNodeId
        ORDER BY c.profile_count DESC;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { chainNodeId },
    },
  );
}
