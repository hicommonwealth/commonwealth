import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const bulkThreads = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  if (!req.user) { // if not logged in, return public threads
    const publicThreadsQuery = (community)
      ? { community: community.id }
      : { chain: chain.id, };

    const publicThreads = await models.OffchainThread.findAll({
      where: publicThreadsQuery,
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
      order: [['created_at', 'DESC']],
    });

    return res.json({ status: 'Success', result: publicThreads.map((c) => c.toJSON()) });
  }

  const allThreadsQuery = (community)
    ? { community: community.id, }
    : { chain: chain.id, };

  const allThreads = await models.OffchainThread.findAll({
    where: allThreadsQuery,
    include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
    order: [['created_at', 'DESC']],
  });

  const userAddresses = await req.user.getAddresses();
  const userAddressIds = Array.from(userAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id));
  const rolesQuery = (community)
    ? { address_id: { [Op.in]: userAddressIds }, offchain_community_id: community.id, }
    : { address_id: { [Op.in]: userAddressIds }, chain_id: chain.id };
  const roles = await models.Role.findAll({
    where: rolesQuery
  });

  const adminRoles = roles.filter((r) => r.permission === 'admin' || r.permission === 'moderator');

  const filteredThreads = await allThreads.filter((thread) => {
    if (userAddressIds.includes(thread.address_id)) {
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
