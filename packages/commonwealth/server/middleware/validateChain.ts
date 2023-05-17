// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import type { DB } from '../models';
import type { ChainInstance } from '../models/chain';
import { Activity } from 'common-common/src/daemons/activity';
import { RedisNamespaces } from 'common-common/src/types';

export const ChainCommunityErrors = {
  ChainDNE: 'Chain does not exist',
};

export type ValidateChainParams = {
  chain?: string;
  chain_id?: string;
};

const getChainQuery = (
  chain_id: string,
  models: DB,
  includeTopics: boolean
) => ({
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
): Promise<[ChainInstance, string]> => {
  const chain_id = params.chain || params.chain_id;
  if (!chain_id) return [null, ChainCommunityErrors.ChainDNE];
  const chain = await models.Chain.findOne(
    getChainQuery(chain_id, models, includeTopics)
  );
  // searching for chain that doesn't exist
  if (chain_id && !chain) return [null, ChainCommunityErrors.ChainDNE];
  return [chain, null];
};

const calcKey = (
  models: DB,
  params: ValidateChainParams,
  includeTopics: Boolean
) =>
  `validateChain:${params.chain || params.chain_id}_${
    includeTopics ? 'withTopics' : 'withoutTopics'
  }`;
export const validateChainActivity = new Activity(
  'validateChain',
  validateChain,
  calcKey,
  0,
  RedisNamespaces.Global_Response
);

export const validateChainWithTopics = async (
  models: DB,
  params: ValidateChainParams
): Promise<[ChainInstance, string]> => {
  return validateChainActivity.queryWithCache(models, params, true);
};

export const recomputeValidateChainCache = async (models, chain_id) => {
  await validateChainActivity.queryWithCacheOverride(
    models,
    { chain_id },
    true
  );
  await validateChainActivity.queryWithCacheOverride(
    models,
    { chain_id },
    false
  );
};
