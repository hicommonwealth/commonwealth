/* eslint-disable prefer-const */
/* eslint-disable dot-notation */
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { NotificationCategories } from '../../shared/types';
import { getProposalUrl, getProposalUrlWithoutObject } from '../../shared/utils';
import proposalIdToEntity from '../util/proposalIdToEntity';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoPostId: 'Must provide a comment or thread ID',
  NoReaction: 'Must provide a reaction',
  NoCommentMatch: 'No matching comment found',
  NoProposalMatch: 'No matching proposal found'
};

const createReaction = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  const { reaction, comment_id, proposal_id, thread_id } = req.body;
  let proposal;
  let root_type;

  if (!thread_id && !proposal_id && !comment_id) {
    return next(new Error(Errors.NoPostId));
  }
  if (!reaction) {
    return next(new Error(Errors.NoReaction));
  }

  const options = {
    reaction,
    address_id: author.id,
  };

  if (community) options['community'] = community.id;
  else if (chain) options['chain'] = chain.id;

  if (thread_id) options['thread_id'] = thread_id;
  else if (proposal_id) {
    const chainEntity = await proposalIdToEntity(models, chain.id, proposal_id);
    if (!chainEntity) return next(new Error(Errors.NoProposalMatch));
    const [prefix, id] = proposal_id.split('_');
    proposal = { id };
    root_type = proposal_id.split('_')[0];
    options['proposal_id'] = proposal_id;
  } else if (comment_id) options['comment_id'] = comment_id;

  let finalReaction;
  let created;
  try {
    [ finalReaction, created ] = await models.OffchainReaction.findOrCreate({
      where: options,
      default: options,
      include: [ models.Address]
    });
    if (created) finalReaction = await models.OffchainReaction.findOne({
      where: options,
      include: [ models.Address]
    });
  } catch (err) {
    return next(new Error(err));
  }

  let comment;
  let cwUrl;
  if (comment_id) {
    comment = await models.OffchainComment.findByPk(Number(comment_id));
    if (!comment) return next(new Error(Errors.NoCommentMatch));

    // Test on variety of comments to ensure root relation + type
    const [prefix, id] = comment.root_id.split('_');
    if (prefix === 'discussion') {
      proposal = await models.OffchainThread.findOne({
        where: { id }
      });
      cwUrl = getProposalUrl(prefix, proposal, comment);
    } else if (prefix.includes('proposal') || prefix.includes('referendum') || prefix.includes('motion')) {
      cwUrl = getProposalUrlWithoutObject(prefix, chain.id, id, comment);
      proposal = id;
    } else {
      proposal = undefined;
    }
    root_type = prefix;
  } else if (thread_id) {
    proposal = await models.OffchainThread.findByPk(Number(thread_id));
    if (!proposal) return next(new Error(Errors.NoProposalMatch));
    cwUrl = getProposalUrl('discussion', proposal, comment);
    root_type = 'discussion';
  }

  const root_title = typeof proposal === 'string' ? '' : (proposal.title || '');

  // dispatch notifications
  const notification_data = {
    created_at: new Date(),
    root_id: comment ? comment.root_id : proposal instanceof models.OffchainThread ? proposal.id : proposal?.root_id,
    root_title,
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

  const location = thread_id
    ? `discussion_${thread_id}`
    : proposal_id || `comment-${comment_id}`;
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewReaction,
    location,
    notification_data,
    {
      user: finalReaction.Address.address,
      author_chain: finalReaction.Address.chain,
      url: cwUrl,
      title: proposal.title || '',
      chain: finalReaction.chain,
      community: finalReaction.community,
      body: (comment_id) ? comment.text : '',
    },
    req.wss,
    [ finalReaction.Address.address ],
  );

  return res.json({ status: 'Success', result: finalReaction.toJSON() });
};

export default createReaction;
