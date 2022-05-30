import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidCommunity: 'Invalid community or chain',
  NeedAddress: 'Must provide address to add',
  MustBeAdmin: 'Must be an admin/mod to invite new members',
  AddressNotFound: 'Address not found',
  AlreadyMember: 'Already a member of this community',
};

const addMember = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [community, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  if (!community) return next(new Error(Errors.InvalidCommunity));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.invitedAddress) return next(new Error(Errors.NeedAddress));

  // check that either invites_enabled === true, or the user is an admin or mod
  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  const requesterIsAdminOrMod = await models.Role.findAll({
    where: {
      address_id: adminAddress.id,
      community_id: community.id,
      permission: ['admin', 'moderator'],
    },
  });
  if (!requesterIsAdminOrMod) return next(new Error(Errors.MustBeAdmin));

  const existingAddress = await models.Address.findOne({
    where: {
      address: req.body.invitedAddress,
      community_id: req.body.invitedAddressChain,
    },
  });
  if (!existingAddress) return next(new Error(Errors.AddressNotFound));
  const existingRole = await models.Role.findOne({
    where: {
      address_id: existingAddress.id,
      community_id: community.id,
    },
  });

  if (existingRole) return next(new Error(Errors.AlreadyMember));

  const role = await models.Role.create({
    address_id: existingAddress.id,
    community_id: community.id,
    permission: 'member',
  });

  return res.json({ status: 'Success', result: role.toJSON() });
};

export default addMember;
