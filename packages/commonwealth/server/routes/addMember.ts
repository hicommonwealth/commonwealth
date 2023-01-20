import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { createRole, findAllRoles, findOneRole } from '../util/roles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidCommunity: 'Invalid community or chain',
  NeedAddress: 'Must provide address to add',
  MustBeAdmin: 'Must be an admin/mod to invite new members',
  AddressNotFound: 'Address not found',
  AlreadyMember: 'Already a member of this community',
};

const addMember = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  if (!req.body.invitedAddress) return next(new AppError(Errors.NeedAddress));

  // check that either invites_enabled === true, or the user is an admin or mod
  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });

  const requesterIsAdminOrMod = await findAllRoles(
    models,
    { where: { address_id: adminAddress.id } },
    chain.id,
    ['admin', 'moderator']
  );
  if (!requesterIsAdminOrMod) return next(new AppError(Errors.MustBeAdmin));

  const existingAddress = await models.Address.findOne({
    where: {
      address: req.body.invitedAddress,
      chain: req.body.invitedAddressChain,
    },
  });
  if (!existingAddress) return next(new AppError(Errors.AddressNotFound));

  const existingRole = await findOneRole(
    models,
    { where: { address_id: existingAddress.id } },
    chain.id
  );

  if (existingRole) return next(new AppError(Errors.AlreadyMember));

  const role = await createRole(models, existingAddress.id, chain.id, 'member');

  return res.json({ status: 'Success', result: role.toJSON() });
};

export default addMember;
