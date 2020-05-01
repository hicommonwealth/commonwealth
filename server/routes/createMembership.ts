import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const createMembership = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error('Invalid chain or community'));
  if (chain && community) return next(new Error('Invalid chain or community'));
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
  if (existingMembership) return next(new Error('Membership already exists'));

  // We should require an address to be created when joining a community.
  // For now, we can just let people join without one, and prompt them to create one afterwards.
  //
  // if (chain) {
  //   const validAddresses = await models.Address.findAll({
  //     where: {
  //       chain: chain.id,
  //       user_id: req.user.id,
  //       verified: { [Op.ne]: null }
  //     }
  //   });
  //   if (validAddresses.length === 0) return next(new Error('Verified address required'));
  // } else if (community) {
  //   const validAddresses = await models.Address.findAll({
  //     where: {
  //       user_id: req.user.id,
  //       verified: { [Op.ne]: null }
  //     }
  //   });
  //   if (validAddresses.length === 0) return next(new Error('Verified address required'));
  // }

  const membership = await models.Membership.create(chain ? {
    user_id: req.user.id,
    chain: chain.id,
  } : {
    user_id: req.user.id,
    community: community.id,
  });

  return res.json({ status: 'Success', result: membership.toJSON() });
};

export default createMembership;
