import { Request, Response, NextFunction } from 'express';
import validateRoles from '../util/validateRoles';
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

const addMember = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  if (!chain) return next(new Error(Errors.InvalidCommunity));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.invitedAddress) return next(new Error(Errors.NeedAddress));

  const isAdminOrMod = await validateRoles(
    models,
    req.user,
    'moderator',
    chain.id
  );
  if (!isAdminOrMod) return next(new Error(Errors.MustBeAdmin));

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
      chain_id: chain.id,
    },
  });

  if (existingRole) return next(new Error(Errors.AlreadyMember));

  const role = await models.Role.create({
    address_id: existingAddress.id,
    chain_id: chain.id,
    permission: 'member',
  });

  return res.json({ status: 'Success', result: role.toJSON() });
};

export default addMember;
