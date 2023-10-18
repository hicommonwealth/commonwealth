import { QueryTypes } from 'sequelize';
import { sequelize } from '../../database';
import { ServerChainsController } from '../server_chains_controller';

export type GetRelatedCommunitiesOptions = { base: string };

export type GetRelatedCommunitiesResult = {
  community: string;
  icon_url: string;
  thread_count: number;
  address_count: number;
}[];

export async function __getRelatedCommunities(
  this: ServerChainsController,
  { base }: GetRelatedCommunitiesOptions
): Promise<GetRelatedCommunitiesResult> {
  // Although this subquery is not necessary as is currently, We should keep it because in the future if we want to
  // paginate, then we will need to paginate through the subquery.
  return await sequelize.query(
    `
    SELECT 
        popular_chains.name as community,
        popular_chains.icon_url,
        popular_chains.thread_count,
        COUNT(a) as address_count 
    FROM 
        (SELECT c.id, c.icon_url, c.name, COUNT(t) as thread_count 
        FROM "ChainNodes" as cn 
        JOIN "Chains" as c on c.chain_node_id = cn.id 
        LEFT JOIN "Threads" as t on t.chain = c.id 
        WHERE cn.name = :base 
        GROUP BY c.id) as popular_chains 
    LEFT JOIN "Addresses" as a on a.chain = popular_chains.id 
    GROUP BY popular_chains.id, popular_chains.icon_url, popular_chains.name, popular_chains.thread_count 
    ORDER BY address_count DESC;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {base}
    }
  );
}