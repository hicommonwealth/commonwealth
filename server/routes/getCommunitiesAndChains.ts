import { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';
import { DB } from '../database';
import { ChainInstance } from "../models/chain";
import { OffchainCommunityInstance } from "../models/offchain_community";
const { Op } = Sequelize;

const DEFAULT_SEARCH_LIMIT = 100;

const getCommunitiesAndChains = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { user } = req;
  const { searchTerm, limit } = req.query;
  const params = {
    limit: Number(limit) || DEFAULT_SEARCH_LIMIT
  };
  if (searchTerm) {
    params['where'] = { name: { [Op.iLike]: `%${searchTerm}%` } };
  }
  const chains: (ChainInstance | OffchainCommunityInstance)[] = await models.Chain.findAll(params);
  const communities = await models.OffchainCommunity.findAll(params);
  let userAddressIds;
  let userRoles;
  if (user) {
    const addresses = await user.getAddresses();
    userAddressIds = addresses.filter((addr) => !!addr.verified).map((addr) => addr.id);
    userRoles = await models.Role.findAll({
      where: {
        address_id: userAddressIds,
      },
    });
  }
  const visibleCommunities = communities.filter((community) => {
    if (!community.privacyEnabled) {
      return true;
    } else {
      if (!user) return false;
      const userMembership = userRoles.find((role) => role.offchain_community_id === community.id);
      return !!userMembership;
    }
  });
  const chainsAndCommunities = chains.concat(visibleCommunities);

  return res.json({ status: 'Success', result: chainsAndCommunities.map((p) => p.toJSON()) });
};

export default getCommunitiesAndChains;
