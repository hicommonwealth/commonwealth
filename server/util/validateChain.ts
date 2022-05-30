// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import { DB } from '../database';
import { CommunityInstance } from '../models/community';

export const ChainCommunityErrors = {
  ChainDNE: 'Chain does not exist',
};

// sequelize 5.0 does not accept undefined key in where clause
const validateChain = async (
  models: DB,
  params: { community?: string; community_id?: string }
): Promise<[CommunityInstance, string]> => {
  const community_id = params.community || params.community_id;
  if (!community_id) return [null, ChainCommunityErrors.ChainDNE];
  const community = await models.Community.findOne({
    where: {
      id: community_id,
    },
    include: [
      {
        model: models.Topic,
        as: 'topics',
        required: false,
        attributes: ['id', 'name', 'community_id'],
      },
    ],
  });
  // searching for chain that doesn't exist
  if (community_id && !community) return [null, ChainCommunityErrors.ChainDNE];
  return [community, null];
};

export default validateChain;
