import { Response, NextFunction } from 'express';
import { NotificationCategories } from '../../shared/types';
import { UserRequest } from '../types';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl } from '../../shared/utils';
import { factory, formatFilename } from '../util/logging';
import { ProposalType } from 'client/scripts/identifiers';
const log = factory.getLogger(formatFilename(__filename));

const createComment = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  const { parent_id, root_id, text } = req.body;

  const mentions = typeof req.body['mentions[]'] === 'string'
    ? [req.body['mentions[]']]
    : typeof req.body['mentions[]'] === 'undefined'
      ? []
      : req.body['mentions[]'];

  if (parent_id) {
    // check that parent comment is in the same community
    const parentCommentIsVisibleToUser = await models.OffchainComment.findOne({
      where: community ? {
        id: parent_id,
        community: community.id,
      } : {
        id: parent_id,
        chain: chain.id,
      }
    });
    if (!parentCommentIsVisibleToUser) return next(new Error('Invalid parent'));
  }

  if (!root_id) {
    return next(new Error('Must provide root_id'));
  }
  if ((!text || !text.trim())
      && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
    return next(new Error('Must provide text or attachment'));
  }
  try {
    const quillDoc = JSON.parse(decodeURIComponent(text));
    if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === ''
        && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
      return next(new Error('Must provide text or attachment'));
    }
  } catch (e) {
    // check always passes if the comment text isn't a Quill document
  }

  // New comments get an empty version history initialized, which is passed
  // the comment's first version, formatted on the frontend with timestamps
  const versionHistory = [];
  versionHistory.push(req.body.versionHistory);
  const commentContent = {
    root_id,
    child_comments: [],
    text,
    version_history: versionHistory,
    address_id: author.id,
    chain: null,
    community: null,
    parent_id: null,
  };
  if (community) Object.assign(commentContent, { community: community.id });
  else if (chain) Object.assign(commentContent, { chain: chain.id });
  if (parent_id) Object.assign(commentContent, { parent_id });

  const comment = await models.OffchainComment.create(commentContent);

  let parentComment;
  if (parent_id) {
    parentComment = await models.OffchainComment.findOne({
      where: community ? {
        id: parent_id,
        community: community.id,
      } : {
        id: parent_id,
        chain: chain.id,
      }
    });
    const arr = parentComment.child_comments;
    arr.push(Number(comment.id));
    parentComment.child_comments = arr;
    await parentComment.save();
  }

  // To-do: attachments can likely be handled like mentions (see lines 10 & 11)
  if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
    await models.OffchainAttachment.create({
      attachable: 'comment',
      attachment_id: comment.id,
      url: req.body['attachments[]'],
      description: 'image',
    });
  } else if (req.body['attachments[]']) {
    await Promise.all(req.body['attachments[]'].map((url) => models.OffchainAttachment.create({
      attachable: 'comment',
      attachment_id: comment.id,
      url,
      description: 'image',
    })));
  }
  // fetch attached objects to return to user
  const finalComment = await models.OffchainComment.findOne({
    where: { id: comment.id },
    include: [models.Address, models.OffchainAttachment],
  });

  // TODO: This isn't a reliable check and may fail. It should never fail.
  // Comments always need identified parents.
  let proposal;
  const [prefix, id] = finalComment.root_id.split('_');
  console.log(prefix);
  if (prefix === 'discussion') {
    proposal = await models.OffchainThread.findOne({
      where: { id }
    });
  } else if (prefix.includes('signaling')) {
    proposal = await models.Proposal.findOne({
      where: { identifier: id, type: prefix }
    });

    // TODO: We can remove this once we identify why signal proposals aren't created
    if (!proposal) {
      await models.Proposal.create({
        chain: chain.id,
        identifier: id,
        type: prefix,
        data: {},
        completed: false,
      });

      proposal = await models.Proposal.findOne({
        where: { identifier: id, type: prefix }
      });
    }
  } else if (prefix.includes('proposal') || prefix.includes('referendum')) {
    proposal = await models.Proposal.findOne({
      where: { identifier: id, type: prefix }
    });
  } else {
    log.error(`No matching proposal of thread for root_id ${comment.root_id}`);
  }
  console.log(proposal);
  if (!proposal || proposal.read_only) {
    await finalComment.destroy();
    return next(new Error('Cannot comment when thread is read_only'));
  }

  // craft commonwealth url
  const cwUrl = getProposalUrl(prefix, proposal, finalComment);

  // auto-subscribe comment author to reactions & child comments
  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewReaction,
    object_id: `comment-${finalComment.id}`,
    is_active: true,
  });

  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewComment,
    object_id: `comment-${finalComment.id}`,
    is_active: true,
  });

  // grab mentions to notify tagged users
  let mentionedAddresses;
  if (mentions && mentions.length) {
    try {
      mentionedAddresses = await Promise.all(mentions.map(async (mention) => {
        mention = mention.split(',');
        const user = await models.Address.findOne({
          where: {
            chain: mention[0],
            address: mention[1],
          },
          include: [ models.User, models.Role ]
        });
        return user;
      }));
    } catch (err) {
      log.error(err);
    }
  }

  // dispatch notifications to root thread
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewComment,
    root_id,
    {
      created_at: new Date(),
      root_id: Number(proposal.id),
      root_title: proposal.title || '',
      root_type: prefix,
      comment_id: Number(finalComment.id),
      comment_text: finalComment.text,
      chain_id: finalComment.chain,
      community_id: finalComment.community,
      author_address: finalComment.Address.address,
      author_chain: finalComment.Address.chain,
    },
    {
      user: finalComment.Address.address,
      url: cwUrl,
      title: proposal.title || '',
      chain: finalComment.chain,
      community: finalComment.community,
    },
    req.wss,
    [ finalComment.Address.address ],
  );

  // if child comment, dispatch notification to parent author
  if (parent_id && parentComment) {
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.NewComment,
      `comment-${parent_id}`,
      {
        created_at: new Date(),
        root_id: Number(proposal.id),
        root_title: proposal.title || '',
        root_type: prefix,
        comment_id: Number(finalComment.id),
        comment_text: finalComment.text,
        parent_comment_id: Number(parent_id),
        parent_comment_text: parentComment.text,
        chain_id: finalComment.chain,
        community_id: finalComment.community,
        author_address: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
      },
      {
        user: finalComment.Address.address,
        url: cwUrl,
        title: proposal.title || '',
        chain: finalComment.chain,
        community: finalComment.community,
      },
      req.wss,
      [ finalComment.Address.address ],
    );
  }

  // notify mentioned users if they have permission to view the originating forum
  if (mentionedAddresses?.length) {
    await Promise.all(mentionedAddresses.map(async (mentionedAddress) => {
      if (!mentionedAddress.User) return; // some Addresses may be missing users, e.g. if the user removed the address

      let shouldNotifyMentionedUser = true;
      if (finalComment.community) {
        const originCommunity = await models.OffchainCommunity.findOne({
          where: { id: finalComment.community }
        });
        if (originCommunity.privacyEnabled) {
          const destinationCommunity = mentionedAddress.Roles
            .find((role) => role.offchain_community_id === originCommunity.id);
          if (destinationCommunity === undefined) shouldNotifyMentionedUser = false;
        }
      }
      if (shouldNotifyMentionedUser) await models.Subscription.emitNotifications(
        models,
        NotificationCategories.NewMention,
        `user-${mentionedAddress.User.id}`,
        {
          created_at: new Date(),
          root_id: Number(proposal.id),
          root_title: proposal.title || '',
          root_type: prefix,
          comment_id: Number(finalComment.id),
          comment_text: finalComment.text,
          chain_id: finalComment.chain,
          community_id: finalComment.community,
          author_address: finalComment.Address.address,
          author_chain: finalComment.Address.chain,
        },
        req.wss,
        [ finalComment.Address.address ],
      );
    }));
  }

  return res.json({ status: 'Success', result: finalComment.toJSON() });
};

export default createComment;
