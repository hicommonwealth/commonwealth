// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import type { DB } from '../models';
import type { ChainInstance } from '../models/chain';

export const ChainCommunityErrors = {
  ChainDNE: 'Chain does not exist',
};

export type ValidateChainParams = {
  chain?: string;
  chain_id?: string;
};

// sequelize 5.0 does not accept undefined key in where clause
const validateChain = async (
  models: DB,
  params: ValidateChainParams
): Promise<[ChainInstance, string]> => {
  const chain_id = params.chain || params.chain_id;
  if (!chain_id) return [null, ChainCommunityErrors.ChainDNE];
  const chain = await models.Chain.findOne({
    where: {
      id: chain_id,
    },
    include: [
      {
        model: models.ChainNode,
        required: true,
      },
    ],
  });
  // searching for chain that doesn't exist
  if (chain_id && !chain) return [null, ChainCommunityErrors.ChainDNE];
  return [chain, null];
};

const validateChainWithTopics = async (
  models: DB,
  params: ValidateChainParams
): Promise<[ChainInstance, string]> => {
  const chain_id = params.chain || params.chain_id;
  if (!chain_id) return [null, ChainCommunityErrors.ChainDNE];
  const chain = await models.Chain.findOne({
    where: {
      id: chain_id,
    },
    include: [
      {
        model: models.Topic,
        as: 'topics',
        required: false,
        attributes: ['id', 'name', 'chain_id'],
      },
      {
        model: models.ChainNode,
        required: true,
      },
    ],
  });
  // searching for chain that doesn't exist
  if (chain_id && !chain) return [null, ChainCommunityErrors.ChainDNE];
  return [chain, null];
};

export default validateChain;
