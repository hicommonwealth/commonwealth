import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoInviteCodeFound: (code) => `Cannot find invite code: ${code}`,
  NoAddressFound: (address) => `Cannot find Address: ${address}`,
  WrongOwner: 'Logged in user does not own address accepting invite',
  NoCommunityFound: (community) => `Cannot find community: ${community}`,
  RoleCreationFailure: 'Failed to create new Role',
  CodeUpdateFailure: 'Failed to Update Code',
};

const acceptInvite = async (models, req: UserRequest, res: Response, next: NextFunction) => {
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
    .filter((addr) => addr.verified)
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

  const membership = await models.Membership.create({
    user_id: req.user.id,
    community: community.id,
  });

  const updatedCode = await code.update({
    used: true,
  });
  if (!updatedCode) return next(new Error(Errors.CodeUpdateFailure));

  return res.json({ status: 'Success', result: { updatedCode, membership } });
};

export default acceptInvite;
