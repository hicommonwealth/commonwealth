import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import { NotificationCategories } from '../../shared/types';

export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleAlreadyExists: 'Role already exists',
};

const createRole = async (models, req, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error(Errors.InvalidChainComm));
  if (chain && community) return next(new Error(Errors.InvalidChainComm));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.address_id) return next(new Error(Errors.InvalidAddress));

  // cannot join private communities using this route
  if (community && community.privacyEnabled) return next(new Error(Errors.InvalidChainComm));

  const validAddress = await models.Address.findOne({
    where: {
      id: req.body.address_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null }
    }
  });
  if (!validAddress) return next(new Error(Errors.InvalidAddress));

  const role = await models.Role.findOrCreate({ where: chain ? {
    address_id: req.body.address_id,
    chain_id: chain.id,
  } : {
    address_id: req.body.address_id,
    offchain_community_id: community.id,
  } });

  const subscription = await models.Subscription.findOrCreate({
    where: chain ? {
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewThread,
      chain_id: chain.id,
      object_id: chain.id,
      is_active: true,
    } : {
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewThread,
      community_id: community.id,
      object_id: community.id,
      is_active: true,
    }
  });

  return res.json({ status: 'Success', result: { role, subscription } });
};

export default createRole;
