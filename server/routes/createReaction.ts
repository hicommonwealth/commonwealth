/* eslint-disable prefer-const */
/* eslint-disable dot-notation */
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { UserRequest } from '../types';
import { NotificationCategories } from '../../shared/types';
import { createCommonwealthUrl } from '../util/routeUtils';

const createReaction = async (models, req: UserRequest, res: Response, next: NextFunction) => {
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

  let comment;
  let parentThread;
  if (req.body.comment_id) {
    comment = await models.OffchainComment.findByPk(Number(req.body.comment_id));
    // Test on variety of comments to ensure root relation + type
    parentThread = await models.OffchainThread.findByPk(Number(comment.root_id.replace('discussion_', '')));
  } else {
    parentThread = await models.OffchainThread.findByPk(Number(req.body.thread_id));
  }

  // craft commonwealth url
  const cwUrl = comment
    ? createCommonwealthUrl(parentThread, comment)
    : createCommonwealthUrl(parentThread);

  // dispatch notifications
  const reactedPost = comment || parentThread;
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewReaction,
    `${reaction.id}`,
    {
      created_at: new Date(),
      root_title: parentThread.title,
      root_id: parentThread.id,
      object_text: reactedPost.text,
      object_id: reactedPost.id,
      chain_id: reactedPost.chain,
      community_id: reactedPost.community,
      author_address: reaction.Address.address,
      author_chain: reaction.Address.chain,
    },
    {
      user: reaction.Address.address,
      url: cwUrl,
      title: parentThread.title,
      chain: chain?.id,
      community: community?.id,
    },
    req.wss,
  );

  return res.json({ status: 'Success', result: reaction.toJSON() });
};

export default createReaction;
