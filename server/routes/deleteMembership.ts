import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const deleteMembership = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) return next(new Error('Not logged in'));

  // Privacy check: Cannot join a private community, but we shouldn't reveal the existence of private communities here
  if (community && community.privacyEnabled) return next(new Error('Invalid chain or community'));

  const existingMembership = await models.Membership.findOne({ where: chain ? {
    user_id: req.user.id,
    chain: chain.id,
  } : {
    user_id: req.user.id,
    community: community.id,
  } });
  if (!existingMembership) return next(new Error('Membership does not exist'));

  await existingMembership.destroy();
  return res.json({ status: 'Success' });
};

export default deleteMembership;
