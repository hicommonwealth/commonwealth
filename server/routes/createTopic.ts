import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  TopicRequired: 'Topic name required',
  MustBeAdmin: 'Must be an admin',
  InvalidTokenThreshold: 'Invalid token threshold'
};

const createTopic = async (models, req, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.name) return next(new Error(Errors.TopicRequired));

  const chainOrCommObj = community ? { offchain_community_id: community.id } : { chain_id: chain.id };
  const userAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
  const adminRoles = await models.Role.findAll({
    where: {
      address_id: { [Op.in]: userAddressIds },
      permission: { [Op.in]: ['admin', 'moderator'] },
      ...chainOrCommObj,
    },
  });
  if (adminRoles.length === 0) {
    return next(new Error(Errors.MustBeAdmin));
  }

  const chainOrCommObj2 = community ? { community_id: community.id } : { chain_id: chain.id };

  const token_threshold_test = parseInt(req.body.token_threshold, 10);
  if (Number.isNaN(token_threshold_test)) {
    return next(new Error(Errors.InvalidTokenThreshold));
  }
  const options = {
    name: req.body.name,
    description: req.body.description,
    token_threshold: req.body.token_threshold,
    ...chainOrCommObj2,
  };

  const newTopic = await models.OffchainTopic.findOrCreate({
    where: options,
    default: options,
  });

  return res.json({ status: 'Success', result: newTopic[0].toJSON() });
};

export default createTopic;
