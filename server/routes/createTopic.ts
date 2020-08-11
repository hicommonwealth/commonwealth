import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  InvalidChainOrCommunity: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  TopicRequired: 'Topic name required',
  MustBeAdmin: 'Must be an admin',
};

const createTopic = async (models, req, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error(Errors.InvalidChainOrCommunity));
  if (chain && community) return next(new Error(Errors.InvalidChainOrCommunity));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.name) return next(new Error(Errors.TopicRequired));

  const chainOrCommObj = community ? { offchain_community_id: community.id } : { chain_id: chain.id };
  const userAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
  const adminRoles = await models.Role.findAll({
    where: {
      address_id: { [Op.in]: userAddressIds },
      ...chainOrCommObj,
    },
  }).filter((role) => role.permission === 'admin' || role.permission === 'moderator');
  if (adminRoles.length === 0) {
    return next(new Error(Errors.MustBeAdmin));
  }

  const chainOrCommObj2 = community ? { community_id: community.id } : { chain_id: chain.id };

  const options = {
    name: req.body.name,
    description: req.body.description,
    ...chainOrCommObj2,
  };

  const newTopic = await models.OffchainTopic.findOrCreate({
    where: options,
    default: options,
  });

  return res.json({ status: 'Success', result: newTopic[0] });
};

export default createTopic;
