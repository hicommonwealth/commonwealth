import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InvalidAddress: 'Invalid address',
  InvalidRole: 'Invalid role',
  NotLoggedIn: 'Not logged in',
  MustBeAdmin: 'Must be an admin to upgrade member',
  NoMember: 'Cannot find member to upgrade',
  NoAdminDemotion: 'Cannot remove yourself as admin',
};

const ValidRoles = ['admin', 'moderator', 'member'];

const upgradeMember = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const { address, new_role } = req.body;
  if (!address) return next(new Error(Errors.InvalidAddress));
  if (!new_role) return next(new Error(Errors.InvalidRole));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  // if chain is present we know we are dealing with a chain first community
  const chainOrCommObj = (chain) ? { chain_id: chain.id } : { offchain_community_id: community.id };
  const requesterAddresses = await req.user.getAddresses();
  const requesterAddressIds = requesterAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id);
  const requesterIsAdmin = await models.Role.findAll({
    where: {
      ...chainOrCommObj,
      address_id: { [Op.in]: requesterAddressIds },
      permission: 'admin',
    },
  });
  if (requesterIsAdmin.length < 1) return next(new Error(Errors.MustBeAdmin));

  const memberAddress = await models.Address.findOne({
    where: {
      address,
    },
  });

  if (!memberAddress) return next(new Error(Errors.InvalidAddress));

  const member = await models.Role.findOne({
    where: {
      ...chainOrCommObj,
      address_id: memberAddress.id,
    },
  });
  if (!member) return next(new Error(Errors.NoMember));
  if (requesterIsAdmin.some((r) => member.id === r.id)) return next(new Error(Errors.NoAdminDemotion));

  if (ValidRoles.includes(new_role)) {
    member.permission = new_role;
  } else {
    return next(new Error(Errors.InvalidRole));
  }

  await member.save();

  return res.json({ status: 'Success', result: member.toJSON() });
};

export default upgradeMember;
