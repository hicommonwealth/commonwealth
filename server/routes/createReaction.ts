/* eslint-disable prefer-const */
/* eslint-disable dot-notation */
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { NotificationCategories } from '../../shared/types';
import { getProposalUrl } from '../../shared/utils';
import proposalIdToEntity from '../util/proposalIdToEntity';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoPostId: 'Must provide a comment or thread ID',
  NoReaction: 'Must provide a reaction',
  NoProposalMatch: 'No matching proposal found'
};

const createReaction = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  const { reaction, comment_id, proposal_id, thread_id } = req.body;

  if (!thread_id && !comment_id) {
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
  else if (proposal_id) options['proposal_id'] = proposal_id;
  else if (comment_id) options['comment_id'] = comment_id;

  let finalReaction;
  let created;
  try {
    [ finalReaction, created ] = await models.OffchainReaction.findOrCreate({
      where: options,
      default: options,
      include: [ models.Address]
    });
    if (created) finalReaction = await models.OffchainReaction.find({
      where: options,
      include: [ models.Address]
    });
  } catch (err) {
    return next(new Error(err));
  }

  let comment;
  let cwUrl;
  let root_type;
  let proposal;
  try {
    if (comment_id) {
      comment = await models.OffchainComment.findByPk(Number(comment_id));
      // Test on variety of comments to ensure root relation + type
      const [prefix, id] = comment.root_id.split('_');
      if (prefix === 'discussion') {
        proposal = await models.OffchainThread.findOne({
          where: { id }
        });
      } else {
        proposal = await proposalIdToEntity(models, chain.id, comment.root_id);
      }
      cwUrl = getProposalUrl(prefix, proposal, comment);
      root_type = prefix;
    } else if (proposal_id) {
      proposal = await proposalIdToEntity(models, chain.id, proposal_id);
      cwUrl = getProposalUrl('discussion', proposal);
      console.log(cwUrl);
      // root_type = PLACEHOLDER
    } else if (thread_id) {
      proposal = await models.OffchainThread.findByPk(Number(thread_id));
      cwUrl = getProposalUrl('discussion', proposal, comment);
      root_type = 'discussion';
    }
  } catch (err) {
    return next(new Error(Errors.NoProposalMatch));
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

  const location = thread_id
    ? `discussion_${thread_id}`
    : proposal_id
      ? `PLACEHOLDER_${proposal_id}`
      : `comment-${comment_id}`;
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
    [ finalReaction.Address.address ],
  );

  return res.json({ status: 'Success', result: finalReaction.toJSON() });
};

export default createReaction;
