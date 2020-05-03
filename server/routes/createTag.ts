import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';

const createTag = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error('Invalid chain or community'));
  if (chain && community) return next(new Error('Invalid chain or community'));
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.name) return next(new Error('Tag name required'));

  const chainOrCommObj = community ? { offchain_community_id: community.id } : { chain_id: chain.id };
  const userAddressIds = await req.user.getAddresses().map((address) => address.id);
  const userMembership = await models.Role.findOne({
    where: {
      address_id: { [Op.in]: userAddressIds },
      ...chainOrCommObj,
    },
  });
  if (userMembership.permission !== 'admin') {
    return next(new Error('Must be an admin'));
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
