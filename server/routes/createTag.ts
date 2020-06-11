import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  InvalidChainOrCommuntiy: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  TagRequired: 'Tag name required',
  MustBeAdmin: 'Must be an admin',
};

const createTag = async (models, req, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error(Errors.InvalidChainOrCommuntiy));
  if (chain && community) return next(new Error(Errors.InvalidChainOrCommuntiy));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.name) return next(new Error(Errors.TagRequired));

  const chainOrCommObj = community ? { offchain_community_id: community.id } : { chain_id: chain.id };
  const userAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
  const userMembership = await models.Role.findOne({
    where: {
      address_id: { [Op.in]: userAddressIds },
      ...chainOrCommObj,
    },
  });
  if (userMembership.permission !== 'admin') {
    return next(new Error(Errors.MustBeAdmin));
  }

  const chainOrCommObj2 = community ? { community_id: community.id } : { chain_id: chain.id };

  const options = {
    name: req.body.name,
    ...chainOrCommObj2,
  };

  const newTag = await models.OffchainTag.findOrCreate({
    where: options,
    default: options,
  });

  return res.json({ status: 'Success', result: newTag[0] });
};

export default createTag;
