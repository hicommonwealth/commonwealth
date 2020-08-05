import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
};

const setDefaultRole = async (models, req, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.address || !req.body.author_chain) return next(new Error(Errors.InvalidAddress));

  const validAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      chain: req.body.author_chain,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null }
    }
  });
  if (!validAddress) return next(new Error(Errors.InvalidAddress));

  const existingRole = await models.Role.findOne({ where: chain ? {
    address_id: validAddress.id,
    chain_id: chain.id,
  } : {
    address_id: validAddress.id,
    offchain_community_id: community.id,
  } });
  if (!existingRole) return next(new Error(Errors.RoleDNE));

  const otherAddresses = await models.Address.findAll({
    where: {
      id: { [Sequelize.Op.ne]: validAddress.id },
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null }
    }
  });

  await models.Role.update({ is_user_default: false }, { where: chain ? {
    address_id: { [Sequelize.Op.in]: otherAddresses.map((a) => a.id) },
    chain_id: chain.id,
  } : {
    address_id: { [Sequelize.Op.in]: otherAddresses.map((a) => a.id) },
    offchain_community_id: community.id,
  } });
  existingRole.is_user_default = true;
  await existingRole.save();

  await models.Subscription.findOrCreate({
    where: chain ? {
      subscriber_id: req.user.id,
      category_id: 'new-thread-creation',
      object_id: chain.id,
      chain_id: chain.id,
    } : {
      subscriber_id: req.user.id,
      category_id: 'new-thread-creation',
      object_id: community.id,
      community_id: community.id,
    }
  });

  return res.json({ status: 'Success' });
};

export default setDefaultRole;
