import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { NotificationCategories } from '../../shared/types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoInviteCodeFound: (code) => `Cannot find invite code: ${code}`,
  NoAddressFound: (address) => `Cannot find Address: ${address}`,
  WrongOwner: 'Logged in user does not own address accepting invite',
  NoCommunityFound: (community) => `Cannot find community: ${community}`,
  RoleCreationFailure: 'Failed to create new role',
  CodeUpdateFailure: 'Failed to update invite code',
};

const acceptInvite = async (models, req: Request, res: Response, next: NextFunction) => {
  const { inviteCode, address, reject } = req.body;

  const code = await models.InviteCode.findOne({
    where: {
      id: inviteCode,
      used: false,
    }
  });
  if (!code) return next(new Error(Errors.NoInviteCodeFound(inviteCode)));

  if (reject === 'true') {
    const rejectedCode = await code.update({
      used: true,
    });
    return res.json({ status: 'Success', result: rejectedCode });
  }

  const addressObj = await models.Address.findOne({
    where: {
      address,
    }
  });
  if (!addressObj) return next(new Error(Errors.NoAddressFound(address)));

  const userAddresses = await req.user.getAddresses();
  const isUser = userAddresses
    .filter((addr) => !!addr.verified)
    .filter((add) => add.address === addressObj.address);

  if (isUser.length === 0) {
    return next(new Error(Errors.WrongOwner));
  }

  const community = await models.OffchainCommunity.findOne({
    where: {
      id: code.community_id,
    }
  });
  if (!community) return next(new Error(Errors.NoCommunityFound(code.community_id)));

  const role = await models.Role.create({
    address_id: addressObj.id,
    offchain_community_id: community.id,
    permission: 'member',
  });
  if (!role) return next(new Error(Errors.RoleCreationFailure));

  const updatedCode = await code.update({
    used: true,
  });
  if (!updatedCode) return next(new Error(Errors.CodeUpdateFailure));

  const subscription = await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewThread,
    object_id: community.id,
    community_id: community.id,
    is_active: true,
  });

  return res.json({ status: 'Success', result: { updatedCode, role, subscription } });
};

export default acceptInvite;
