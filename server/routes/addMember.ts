import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidCommunity: 'Invalid community or chain',
  NeedAddress: 'Must provide address to add',
  MustBeAdmin: 'Must be an admin/mod to invite new members',
  AddressNotFound: 'Address not found',
  AlreadyMember: 'Already a member of this community',
};

const addMember = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!community && !chain) return next(new Error(Errors.InvalidCommunity));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.invitedAddress) return next(new Error(Errors.NeedAddress));
  const chainOrCommunity = chain ? { chain_id: chain.id } : { offchain_community_id: community.id }
  
  // check that either invitesEnabled === true, or the user is an admin or mod
  if ((community && !community.invitesEnabled) || chain) {
    const adminAddress = await models.Address.findOne({
      where: {
        address: req.body.address,
        user_id: req.user.id,
      },
    });
    const requesterIsAdminOrMod = await models.Role.findAll({
      where: {
        address_id: adminAddress.id,
        ...chainOrCommunity,
        permission: ['admin', 'moderator'],
      },
    });
    if (!requesterIsAdminOrMod) return next(new Error(Errors.MustBeAdmin));
  }

  const existingAddress = await models.Address.findOne({
    where: {
      address: req.body.invitedAddress,
      chain: req.body.invitedAddressChain,
    },
  });
  if (!existingAddress) return next(new Error(Errors.AddressNotFound));
  const existingRole = await models.Role.findOne({
    where: {
      address_id: existingAddress.id,
      ...chainOrCommunity,
    },
  });

  if (existingRole) return next(new Error(Errors.AlreadyMember));

  const role = await models.Role.create({
    address_id: existingAddress.id,
    // offchain_community_id: community.id,
    ...chainOrCommunity,
    permission: 'member',
  });

  return res.json({ status: 'Success', result: role.toJSON() });
};

export default addMember;
