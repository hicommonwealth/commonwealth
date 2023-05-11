// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import type { DB } from '../models';
import type { CommunityInstance } from '../models/communities';

export const ChainCommunityErrors = {
  ChainDNE: 'Chain does not exist',
};

export type ValidateChainParams = {
  chain?: string;
  chain_id?: string;
};

const getChainQuery = (chain_id: string, models: DB, includeTopics: boolean) => ({
  where: {
    id: chain_id,
  },
  include: [
    ...(includeTopics
      ? [
          {
            model: models.Topic,
            as: 'topics',
            required: false,
            attributes: ['id', 'name', 'chain_id'],
          },
        ]
      : []),
    {
      model: models.ChainNode,
      required: true,
    },
  ],
});

export const validateChain = async (
  models: DB,
  params: ValidateChainParams,
  includeTopics = false
): Promise<[CommunityInstance, string]> => {
  const chain_id = params.chain || params.chain_id;
  if (!chain_id) return [null, ChainCommunityErrors.ChainDNE];
  const chain = await models.Community.findOne(
    getChainQuery(chain_id, models, includeTopics)
  );
  // searching for chain that doesn't exist
  if (chain_id && !chain) return [null, ChainCommunityErrors.ChainDNE];
  return [chain, null];
};

export const validateChainWithTopics = async (
  models: DB,
  params: ValidateChainParams
): Promise<[CommunityInstance, string]> => {
  return validateChain(models, params, true);
};
