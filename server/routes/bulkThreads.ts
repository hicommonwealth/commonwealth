import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';

const bulkThreads = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  const userAddresses = await req.user.getAddresses();
  const userAddressIds = Array.from(userAddresses.map((address) => address.id));
  const roles = await models.Role.findAll({
    where: community ? {
      address_id: { [Op.in]: userAddressIds },
      offchain_community_id: community.id,
    } : chain ? {
      address_id: { [Op.in]: userAddressIds },
      chain_id: chain.id,
    } : {},
  });

  const adminRoles = roles.filter((r) => r.permission === 'admin' || r.permission === 'moderator');

  const allThreads = await models.OffchainThread.findAll({
    where:
      community
        ? {
          community: community.id,
        } : chain ? {
          chain: chain.id,
        } : {},
    include: [
      models.Address,
      {
        model: models.OffchainTag,
        as: 'tags',
        through: {
          model: models.TaggedThread,
          as: 'taggedThreads',
        },
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const filteredThreads = await allThreads.filter((thread) => {
    if (thread.private === false) {
      return true;
    } else if (userAddressIds.includes(thread.author_id)) {
      return true;
    } else if (adminRoles.length > 0) {
      return true;
    } else {
      return false;
    }
  });

  return res.json({ status: 'Success', result: filteredThreads.map((c) => c.toJSON()) });
};

export default bulkThreads;
