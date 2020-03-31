// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import { NextFunction } from 'express';

const lookupCommunityIsVisibleToUser = async (models, params, user, next: NextFunction): Promise<any> => {
  const chain = await models.Chain.findOne({
    where: {
      id: params.chain,
    },
    include: {
      model: models.OffchainTag,
      as: 'tags',
      attributes: ['id', 'name', 'community_id', 'chain_id'],
    },
  });
  const community = await models.OffchainCommunity.findOne({
    where: {
      id: params.community,
    },
    include: {
      model: models.OffchainTag,
      as: 'tags',
      attributes: ['id', 'name', 'community_id', 'chain_id'],
    },
  });

  // searching for both chain and community
  if (params.chain && params.community) return next(new Error('Invalid community or chain'));
  // searching for chain that doesn't exist
  if (params.chain && !chain) return next(new Error('Invalid community or chain'));
  // searching for community that doesn't exist
  if (params.community && !community) return next(new Error('Invalid community or chain'));
  // searching for both chain and community with results
  if (chain && community) return next(new Error('Invalid community or chain'));
  // searching for chain and community that both don't exist
  if (!chain && !community) return next(new Error('Invalid community or chain'));

  if (community && community.privacyEnabled) {
    if (!user) return next(new Error('Invalid community or chain'));
    const userAddressIds = await user.getAddresses().map((address) => address.id);
    const userMembership = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        offchain_community_id: community.id,
      },
    });
    if (!userMembership) return next(new Error('Invalid community or chain'));
  }
  return [chain, community];
};

export default lookupCommunityIsVisibleToUser;
