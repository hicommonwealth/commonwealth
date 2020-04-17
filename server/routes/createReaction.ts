/* eslint-disable prefer-const */
/* eslint-disable dot-notation */
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { UserRequest } from '../types';
import { NotificationCategories } from '../../shared/types';
import { createCommonwealthUrl } from '../../shared/utils';

const createReaction = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  const { reaction, comment_id, thread_id } = req.body;

  if (!thread_id && !comment_id) {
    return next(new Error('Must provide a comment or thread id'));
  }
  if (!reaction) {
    return next(new Error('Must provide text'));
  }

  const options = {
    reaction,
    address_id: author.id,
  };

  if (community) options['community'] = community.id;
  else if (chain) options['chain'] = chain.id;
  if (thread_id) options['thread_id'] = thread_id;
  else if (comment_id) options['comment_id'] = comment_id;

  let [ finalReaction, created ] = await models.OffchainReaction.findOrCreate({
    where: options,
    default: options,
    include: [ models.Address]
  });
  if (created) finalReaction = await models.OffchainReaction.find({
    where: options,
    include: [ models.Address]
  });

  let comment;
  let cwUrl;
  let root_type;
  let proposal;
  if (comment_id) {
    comment = await models.OffchainComment.findByPk(Number(comment_id));
    // Test on variety of comments to ensure root relation + type
    const [prefix, id] = comment.root_id.split('_');
    if (prefix === 'discussion') {
      proposal = await models.OffchainThread.findOne({
        where: { id }
      });
    } else if (prefix.includes('proposal')) {
      proposal = await models.Proposal.findOne({
        where: { id }
      });
    }
    cwUrl = createCommonwealthUrl(prefix, proposal, comment);
    root_type = prefix;
  } else {
    proposal = await models.OffchainThread.findByPk(Number(thread_id));
    cwUrl = createCommonwealthUrl('discussion', proposal, comment);
    root_type = 'discussion';
  }

  // dispatch notifications
  const notification_data = {
    created_at: new Date(),
    root_id: Number(proposal.id),
    root_title: proposal.title || '',
    root_type,
    chain_id: finalReaction.chain,
    community_id: finalReaction.community,
    author_address: finalReaction.Address.address,
    author_chain: finalReaction.Address.chain,
  };

  if (comment_id) {
    notification_data['comment_id'] = Number(comment.id);
    notification_data['comment_text'] = comment.text;
  }

  const location = thread_id ? `discussion_${thread_id}` : `comment-${comment_id}`;
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewReaction,
    location,
    notification_data,
    {
      user: finalReaction.Address.address,
      url: cwUrl,
      title: proposal.title || '',
      chain: finalReaction.chain,
      community: finalReaction.community,
    },
    req.wss,
  );

  return res.json({ status: 'Success', result: reaction.toJSON() });
};

export default createReaction;
