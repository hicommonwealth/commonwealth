/* eslint-disable prefer-const */
/* eslint-disable dot-notation */
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { UserRequest } from '../types';

const createReaction = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  console.log(req.body);
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  if (!req.body.thread_id && !req.body.comment_id) {
    return next(new Error('Must provide a comment or thread id'));
  }
  if (!req.body.reaction) {
    return next(new Error('Must provide text'));
  }

  const options = {
    reaction: req.body.reaction,
    address_id: author.id,
  };

  if (community) options['community'] = community.id;
  else if (chain) options['chain'] = chain.id;
  if (req.body.thread_id) options['thread_id'] = req.body.thread_id;
  else if (req.body.comment_id) options['comment_id'] = req.body.comment_id;

  let [ reaction, created ] = await models.OffchainReaction.findOrCreate({
    where: options,
    default: options,
    include: [ models.Address]
  });
  if (created) reaction = await models.OffchainReaction.find({
    where: options,
    include: [ models.Address]
  });
  return res.json({ status: 'Success', result: reaction.toJSON() });
};

export default createReaction;
