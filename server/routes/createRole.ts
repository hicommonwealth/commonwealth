import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';

const createRole = async (models, req, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error('Invalid chain or community'));
  if (chain && community) return next(new Error('Invalid chain or community'));
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.address_id) return next(new Error('Invalid address'));

  // cannot join private communities using this route
  if (community && community.privacyEnabled) return next(new Error('Invalid chain or community'));

  const validAddress = await models.Address.findOne({
    where: {
      id: req.body.address_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null }
    }
  });
  if (!validAddress) return next(new Error('Invalid address'));

  const existingRole = await models.Role.findOne({ where: chain ? {
    address_id: req.body.address_id,
    chain_id: chain.id,
  } : {
    address_id: req.body.address_id,
    offchain_community_id: community.id,
  } });
  if (existingRole) return next(new Error('Role already exists'));

  const newRole = await models.Role.create(chain ? {
    address_id: req.body.address_id,
    chain_id: chain.id,
    permission: 'member',
  } : {
    address_id: req.body.address_id,
    offchain_community_id: community.id,
    permission: 'member',
  });

  return res.json({ status: 'Success', result: newRole.toJSON() });
};

export default createRole;
