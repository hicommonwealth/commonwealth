import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const addMember = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!community) return next(new Error('Invalid community'));
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.invitedAddress) return next(new Error('Must provide address to add'));

  // check that either invitesEnabled === true, or the user is an admin or mod
  if (!community.invitesEnabled) {
    const adminAddress = await models.Address.findOne({
      where: {
        address: req.body.address,
        user_id: req.user.id,
      },
    });
    const requesterIsAdminOrMod = await models.Role.findAll({
      where: {
        address_id: adminAddress.id,
        offchain_community_id: community.id,
        permission: ['admin', 'moderator'],
      },
    });
    if (!requesterIsAdminOrMod) return next(new Error('Must be an admin/mod to invite new members'));
  }

  const existingAddress = await models.Address.findOne({
    where: {
      address: req.body.invitedAddress,
      chain: req.body.invitedAddressChain,
    },
  });
  if (!existingAddress) return next(new Error('Address not found'));
  const existingRole = await models.Role.findOne({
    where: {
      address_id: existingAddress.id,
      offchain_community_id: community.id,
    },
  });

  if (existingRole) return next(new Error('Already a member of this community'));

  const role = await models.Role.create({
    address_id: existingAddress.id,
    offchain_community_id: community.id,
    permission: 'member',
  });

  return res.json({ status: 'Success', result: role.toJSON() });
};

export default addMember;
