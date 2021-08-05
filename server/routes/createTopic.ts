import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  TopicRequired: 'Topic name required',
  MustBeAdmin: 'Must be an admin',
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
  if (!req.user.isAdmin && adminRoles.length === 0) {
    return next(new Error(Errors.MustBeAdmin));
  }

  const chainOrCommObj2 = community ? { community_id: community.id } : { chain_id: chain.id };

  const options = {
    name: req.body.name,
    description: req.body.description,
    featured_in_sidebar: req.body.featured_in_sidebar,
    featured_in_new_post: req.body.featured_in_new_post,
    ...chainOrCommObj2,
  };

  const newTopic = await models.OffchainTopic.findOrCreate({
    where: options,
    default: options,
  });

  return res.json({ status: 'Success', result: newTopic[0].toJSON() });
};

export default createTopic;
