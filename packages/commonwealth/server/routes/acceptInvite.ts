import { AppError, ServerError } from 'common-common/src/errors';
import { NotificationCategories } from 'common-common/src/types';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { createRole } from '../util/roles';

export const Errors = {
  NoInviteCodeFound: (code) => `Cannot find invite code: ${code}`,
  NoAddressFound: (address) => `Cannot find Address: ${address}`,
  WrongOwner: 'Logged in user does not own address accepting invite',
  NoCommunityFound: (community) => `Cannot find community: ${community}`,
  RoleCreationFailure: 'Failed to create new role',
  CodeUpdateFailure: 'Failed to update invite code',
};

const acceptInvite = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { inviteCode, address, reject } = req.body;

  const code = await models.InviteCode.findOne({
    where: {
      id: inviteCode,
      used: false,
    },
  });
  if (!code) return next(new AppError(Errors.NoInviteCodeFound(inviteCode)));

  if (reject === 'true') {
    const rejectedCode = await code.update({
      used: true,
    });
    return res.json({ status: 'Success', result: rejectedCode.toJSON() });
  }

  const addressObj = await models.Address.findOne({
    where: {
      address,
    },
  });
  if (!addressObj) return next(new AppError(Errors.NoAddressFound(address)));

  const userAddresses = await req.user.getAddresses();
  const isUser = userAddresses
    .filter((addr) => !!addr.verified)
    .filter((add) => add.address === addressObj.address);

  if (isUser.length === 0) {
    return next(new AppError(Errors.WrongOwner));
  }

  const chain = await models.Chain.findOne({
    where: { id: code.chain_id },
  });
  if (!chain) {
    return next(new AppError(Errors.NoCommunityFound(code.chain_id)));
  }

  const role = await createRole(models, addressObj.id, chain?.id, 'member');

  if (!role) return next(new ServerError(Errors.RoleCreationFailure));

  const updatedCode = await code.update({
    used: true,
  });
  if (!updatedCode) return next(new ServerError(Errors.CodeUpdateFailure));

  const subscription = await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewThread,
    object_id: chain.id,
    chain_id: chain?.id,
    is_active: true,
  });

  return res.json({
    status: 'Success',
    result: {
      updatedCode: updatedCode.toJSON(),
      role: role.toJSON(),
      subscription: subscription.toJSON(),
    },
  });
};

export default acceptInvite;
