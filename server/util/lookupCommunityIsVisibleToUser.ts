// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import { ChainInstance } from '../models/chain';

export const ChainCommunityErrors = {
  ChainDNE: 'Chain does not exist',
};

// sequelize 5.0 does not accept undefined key in where clause
const lookupCommunityIsVisibleToUser = async (
  models, params, user
): Promise<[ChainInstance, string]> => {
  if (!params.chain) return [null, ChainCommunityErrors.ChainDNE];
  const chain = await models.Chain.findOne({
    where: {
      id: params.chain,
    },
    include: [
      {
        model: models.OffchainTopic,
        as: 'topics',
        required: false,
        attributes: ['id', 'name', 'chain_id'],
      },
    ],
  });
  // searching for chain that doesn't exist
  if (params.chain && !chain) return [null, ChainCommunityErrors.ChainDNE];
  return [chain, null];
};

export default lookupCommunityIsVisibleToUser;
