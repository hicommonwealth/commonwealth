// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import type { CommunityInstance, DB } from '@hicommonwealth/model';
import { ALL_COMMUNITIES } from './databaseValidationService';

export const CommunityCommunityErrors = {
  CommunityDNE: 'Community does not exist',
};

export type ValidateCommunityParams = {
  chain?: string;
  chain_id?: string;
  community_id?: string;
};

const getCommunityQuery = (
  communityId: string,
  models: DB,
  includeTopics: boolean,
) => ({
  where: {
    id: communityId,
  },
  include: [
    ...(includeTopics
      ? [
          {
            model: models.Topic,
            as: 'topics',
            required: false,
            attributes: ['id', 'name', 'community_id'],
          },
        ]
      : []),
    {
      model: models.ChainNode,
      required: true,
    },
  ],
});

export const validateCommunity = async (
  models: DB,
  params: ValidateCommunityParams,
  includeTopics = false,
): Promise<[CommunityInstance, string, boolean]> => {
  const communityId = params.chain || params.chain_id || params.community_id;
  if (communityId === ALL_COMMUNITIES) {
    // if all chains, then bypass validation
    return [null, null, true];
  }
  if (!communityId) {
    return [null, CommunityCommunityErrors.CommunityDNE, false];
  }
  const community = await models.Community.findOne(
    getCommunityQuery(communityId, models, includeTopics),
  );
  // searching for chain that doesn't exist
  if (!community) {
    return [null, CommunityCommunityErrors.CommunityDNE, false];
  }
  return [community, null, false];
};

export const validateCommunityWithTopics = async (
  models: DB,
  params: ValidateCommunityParams,
): Promise<[CommunityInstance, string, boolean]> => {
  return validateCommunity(models, params, true);
};
