/* eslint-disable no-restricted-syntax */
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoStageId: 'Must supply stage ID',
  NotAdmin: 'Must be an admin to edit or feature stages',
  NotVerified: 'Must have a verified address to edit or feature stages',
  StageNotFound: 'Stage not found'
};

const editStage = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  if (!req.body.id) {
    return next(new Error(Errors.NoStageId));
  }

  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  if (!adminAddress.verified) {
    return next(new Error(Errors.NotVerified));
  }

  const roleWhere = {
    address_id: adminAddress.id,
    permission: 'admin',
  };
  if (community) {
    roleWhere['offchain_community_id'] = community.id;
  } else if (chain) {
    roleWhere['chain_id'] = chain.id;
  }
  const requesterIsAdminOrMod = await models.Role.findOne({
    where: roleWhere,
  });
  if (requesterIsAdminOrMod === null) {
    return next(new Error(Errors.NotAdmin));
  }

  const { id, name, description, featured_order, featured_in_sidebar, featured_in_new_post } = req.body;
  try {
    const stage = await models.OffchainStage.findOne({ where: { id } });
    if (!stage) return next(new Error(Errors.StageNotFound));
    if (name) stage.name = name;
    if (name || description) stage.description = description;
    stage.featured_in_sidebar = featured_in_sidebar;
    stage.featured_in_new_post = featured_in_new_post;
    await stage.save();

    return res.json({ status: 'Success', result: stage.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editStage;
