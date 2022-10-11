import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from 'common-common/src/logging';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { createRole, findAllRoles } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));

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
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  if (!chain) return next(new AppError(Errors.InvalidCommunity));
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
    { address_id: adminAddress.id },
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
  const existingRole = await models.Role.findOne({
    where: {
      address_id: existingAddress.id,
      chain_id: chain.id,
    },
  });

  if (existingRole) return next(new AppError(Errors.AlreadyMember));

  const role = await createRole(models, existingAddress.id, chain.id, 'member');

  return res.json({ status: 'Success', result: role.toJSON() });
};

export default addMember;
