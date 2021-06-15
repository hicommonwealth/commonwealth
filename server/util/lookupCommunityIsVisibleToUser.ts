// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import { ChainInstance } from '../models/chain';
import { OffchainCommunityInstance } from '../models/offchain_community';

export const ChainCommunityErrors = {
  CannotProvideBothCommunityAndChain: 'Cannot provide both community and chain',
  ChainDNE: 'Chain does not exist',
  CommunityDNE: 'Community does not exist',
  MustProvideCommunityOrChain: 'Must provide community or chain',
  BothChainAndCommunityDNE: 'Neither chain nor community exist',
  NoUserProvided: 'No user provided for privacy-enabled community',
  NotMember: 'User is not member of private community',
};

const lookupCommunityIsVisibleToUser = async (
  models, params, user
): Promise<[ChainInstance, OffchainCommunityInstance, string]> => {
  const chain = await models.Chain.findOne({
    where: {
      id: params.chain,
    },
    include: [
      {
        model: models.OffchainTopic,
        as: 'topics',
        required: false,
        attributes: ['id', 'name', 'community_id', 'chain_id'],
      },
    ],
  });
  const community = await models.OffchainCommunity.findOne({
    where: {
      id: params.community,
    },
    include: {
      model: models.OffchainTopic,
      as: 'topics',
    },
  });
  // searching for both chain and community
  if (params.chain && params.community) return [null, null, ChainCommunityErrors.CannotProvideBothCommunityAndChain];
  // searching for chain that doesn't exist
  if (params.chain && !chain) return [null, null, ChainCommunityErrors.ChainDNE];
  // searching for community that doesn't exist
  if (params.community && !community) return [null, null, ChainCommunityErrors.CommunityDNE];
  // searching for both chain and community with results
  if (chain && community) return [null, null, ChainCommunityErrors.CannotProvideBothCommunityAndChain];
  // searching for chain and community that both don't exist
  if (!chain && !community) return [null, null, ChainCommunityErrors.BothChainAndCommunityDNE];

  if (community && community.privacyEnabled && !user?.isAdmin) {
    if (!user) return [null, null, ChainCommunityErrors.NoUserProvided];
    const userAddressIds = await user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    const userMembership = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        offchain_community_id: community.id,
      },
    });
    if (!userMembership) return [null, null, ChainCommunityErrors.NotMember];
  }
  return [chain, community, null];
};

export default lookupCommunityIsVisibleToUser;
