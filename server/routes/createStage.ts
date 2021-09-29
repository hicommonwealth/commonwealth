import { Op } from 'sequelize';
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  StageRequired: 'Stage name required',
  MustBeAdmin: 'Must be an admin',
  DefaultTemplateRequired: 'Default Template required',
};

const createStage = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(
    models,
    req.body,
    req.user
  );
  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.name) return next(new Error(Errors.StageRequired));
  if (
    req.body.featured_in_new_post === 'true' &&
    !req.body.default_offchain_template?.trim()
  ) {
    return next(new Error(Errors.DefaultTemplateRequired));
  }

  const chainOrCommObj = community
    ? { offchain_community_id: community.id }
    : { chain_id: chain.id };
  const userAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
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

  const chainOrCommObj2 = community
    ? { community_id: community.id }
    : { chain_id: chain.id };

  const options = {
    name: req.body.name,
    description: req.body.description || '',
    featured_in_sidebar: req.body.featured_in_sidebar || false,
    featured_in_new_post: req.body.featured_in_new_post || false,
    default_offchain_template: req.body.default_offchain_template || '',
    ...chainOrCommObj2,
  };

  const newStage = await models.OffchainStage.findOrCreate({
    where: options,
    defaults: options,
  });

  return res.json({ status: 'Success', result: newStage[0].toJSON() });
};

export default createStage;
