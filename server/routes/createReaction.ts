import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { UserRequest } from '../types';

const createReaction = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  if (!req.body.object_id) {
    return next(new Error('Must provide object_id, address'));
  }
  if (!req.body.reaction) {
    return next(new Error('Must provide text'));
  }

  const reaction = await models.OffchainReaction.create(community ? {
    community: community.id,
    object_id: req.body.object_id,
    reaction: req.body.reaction,
    address_id: author.id,
  } : {
    chain: chain.id,
    object_id: req.body.object_id,
    reaction: req.body.reaction,
    address_id: author.id,
  });

  return res.json({ status: 'Success', result: reaction.toJSON() });
};

export default createReaction;
