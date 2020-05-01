import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const upgradeMember = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  console.dir(req.body);
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const { address, new_role } = req.body;
  if (!address) return next(new Error('Invalid Address'));
  if (!new_role) return next(new Error('Invalid Role'));
  if (!req.user) return next(new Error('Not logged in'));
  // if chain is present we know we are dealing with a chain first community
  const chainOrCommObj = (chain) ? { chain_id: chain.id } : { offchain_community_id: community.id };
  const requesterAddresses = await req.user.getAddresses();
  const requesterAddressIds = Array.from(requesterAddresses.map((a) => a.id));
  const requesterIsAdmin = await models.Role.findAll({
    where: {
      ...chainOrCommObj,
      address_id: { [Op.in]: requesterAddressIds },
      permission: 'admin',
    },
  });
  if (requesterIsAdmin.length < 1) return next(new Error('Must be an Admin to upgrade member'));

  const memberAddress = await models.Address.findOne({
    where: {
      address,
    },
  });

  const member = await models.Role.findOne({
    where: {
      ...chainOrCommObj,
      address_id: memberAddress.id,
    },
  });
  if (!member) return next(new Error('Cannot find member to upgrade!'));
  if (requesterIsAdmin.some((r) => member.id === r.id)) return next(new Error('Cannot demote self'));

  member.permission = new_role;
  await member.save();

  return res.json({ status: 'Success', result: member.toJSON() });
};

export default upgradeMember;
