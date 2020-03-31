import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const acceptInvite = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  const { inviteCode, address, reject } = req.body;

  const code = await models.InviteCode.findOne({
    where: {
      id: inviteCode,
      used: false,
    }
  });
  if (!code) return next(new Error(`Cannot find invite code: ${inviteCode}`));

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
  if (!addressObj) return next(new Error(`Cannot find Address: ${address}`));

  const userAddresses = await req.user.getAddresses();
  const isUser = userAddresses.filter((add) => add.address === addressObj.address);
  if (!isUser) {
    return next(new Error('User logged in does not own address accepting invite'));
  }

  const community = await models.OffchainCommunity.findOne({
    where: {
      id: code.community_id,
    }
  });
  if (!community) return next(new Error(`Cannot find community: ${code.community_id}`));

  const role = await models.Role.create({
    address_id: addressObj.id,
    offchain_community_id: community.id,
    permission: 'member',
  });
  if (!role) return next(new Error('Failed to create new Role'));

  const membership = await models.Membership.create({
    user_id: req.user.id,
    community: community.id,
  });

  const updatedCode = await code.update({
    used: true,
  });
  if (!updatedCode) return next(new Error('Failed to Update Code'));

  return res.json({ status: 'Success', result: { updatedCode, membership } });
};

export default acceptInvite;
