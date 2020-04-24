import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const upgradeMember = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  console.dir(req.body);
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const { address, new_role } = req.body;
  if (!address) return next(new Error('Invalid Address'));
  if (!new_role) return next(new Error('Invalid Role'));
  if (!req.user) return next(new Error('Not logged in'));
  // if chain is present we know we are dealing with a chain first community
  const chainOrCommObj = (chain) ? { chain_id: chain.id } : { offchain_community_id: community.id };
  console.dir(chainOrCommObj);
  const requesterIsAdmin = await models.Role.findAll({
    where: {
      ...chainOrCommObj,
      address_id: req.user.address,
      permission: 'admin',
    },
  });
  if (!requesterIsAdmin) return next(new Error('Must be an Admin to upgrade member'));

  const memberAddress = await models.Address.findOne({
    where: {
      address,
    },
  });

  console.dir(memberAddress);
  let member = await models.Role.findOne({
    where: {
      ...chainOrCommObj,
      address_id: memberAddress.id,
      // permission: ['moderator', 'member'],
    },
  });
  console.dir(new_role);
  if (!member) return next(new Error('Cannot find member to upgrade!'));
  // if (member.permission === 'admin') return next(new Error('Cannot demote admin'));
  member = await member.update({
    permission: new_role,
  });
  console.dir(member);

  return res.json({ status: 'Success', result: member.toJSON() });
};

export default upgradeMember;
