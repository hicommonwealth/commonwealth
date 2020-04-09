import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const deleteRole = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.address_id) return next(new Error('Invalid address'));

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
  if (!existingRole) return next(new Error('Role does not exist'));

  await existingRole.destroy();

  return res.json({ status: 'Success' });
};

export default deleteRole;
