import { Request, Response, NextFunction } from 'express';
import { } from '../../shared/types';

import { Op } from 'sequelize';
import _ from 'lodash';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoChain: 'No Base Chain provided in query',
  NoAddress: 'No address provided in query',
  NoAddressFound: 'No address found',
};

const getProfile = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, address } = req.query;
  if (!chain) return next(new Error(Errors.NoChain));
  if (!address) return next(new Error(Errors.NoAddress));

  const publicCommunities = await models.OffchainCommunity.findAll({
    where: { privacyEnabled: false },
  });
  const visibleCommunityIds = publicCommunities.map((c) => c.id);

  if (req.user) {
    const addresses = await req.user.getAddresses().filter((a) => !!a.verified);
    const addressIds = addresses.map((a) => a.id);
    const roles = await models.Role.findAll({
      where: {
        address_id: { [Op.in]: addressIds },
      },
    });
    const visiblePrivateCommunityIds = roles.map((role) => role.offchain_community_id);
    const privateCommunities = await models.OffchainCommunity.findAll({
      where: {
        privacyEnabled: true,
        id: {
          [Op.in]: visiblePrivateCommunityIds,
        },
      },
    });
    privateCommunities.forEach((c) => visibleCommunityIds.push(c.id));
  }

  const publicChains = await models.Chain.findAll();
  const visibleChainIds = publicChains.map((c) => c.id);


  const addressModel = await models.Address.findOne({
    where: {
      address,
      chain,
    },
    include: [ models.OffchainProfile, ],
  });
  if (!addressModel) return next(new Error(Errors.NoAddressFound));

  const threads = await models.OffchainThread.findAll({
    where: {
      address_id: addressModel.id,
      [Op.or]: [{
        community: { [Op.in]: visibleCommunityIds }
      }, {
        chain: { [Op.in]: visibleChainIds }
      }]
    },
    include: [ models.Address, ],
  });

  const comments = await models.OffchainComment.findAll({
    where: {
      address_id: addressModel.id,
      [Op.or]: [{
        community: { [Op.in]: visibleCommunityIds }
      }, {
        chain: { [Op.in]: visibleChainIds }
      }]
    },
  });

  return res.json({ status: 'Success', result: { account: addressModel, threads, comments } });
};

export default getProfile;
