// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

export const ChainCommunityError = 'Invalid community or chain';

const lookupCommunityIsVisibleToUser = async (models, params, user): Promise<any> => {
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
  if (params.chain && params.community) return [];
  // searching for chain that doesn't exist
  if (params.chain && !chain) return [];
  // searching for community that doesn't exist
  if (params.community && !community) return [];
  // searching for both chain and community with results
  if (chain && community) return [];
  // searching for chain and community that both don't exist
  if (!chain && !community) return [];

  if (community && community.privacyEnabled) {
    if (!user) return [];
    const userAddressIds = await user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    const userMembership = await models.Role.findOne({
      where: {
        address_id: userAddressIds,
        offchain_community_id: community.id,
      },
    });
    if (!userMembership) return [];
  }
  return [chain, community];
};

export default lookupCommunityIsVisibleToUser;
