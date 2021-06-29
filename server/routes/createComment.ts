import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { parseUserMentions } from '../util/parseUserMentions';
import { NotificationCategories } from '../../shared/types';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl, getProposalUrlWithoutObject, renderQuillDeltaToText } from '../../shared/utils';
import proposalIdToEntity from '../util/proposalIdToEntity';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { factory, formatFilename } from '../../shared/logging';

import { SENDGRID_API_KEY } from '../config';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  MissingRootId: 'Must provide root_id',
  InvalidParent: 'Invalid parent',
  MissingTextOrAttachment: 'Must provide text or attachment',
  ThreadNotFound: 'Cannot comment; thread not found',
  // ChainEntityNotFound: 'Cannot comment; chain entity not found',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  InsufficientTokenBalance: 'Users need to hold some of the community\'s tokens to comment',
  CouldNotFetchTokenBalance: 'Unable to fetch user\'s token balance',
};

const createComment = async (
  models,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new Error(authorError));

  const { parent_id, root_id, text } = req.body;

  if (chain && chain.type === 'token') {
    // skip check for admins
    const isAdmin = await models.Role.findAll({
      where: {
        address_id: author.id,
        chain_id: chain.id,
        permission: ['admin'],
      },
    });
    if (isAdmin.length === 0) {
      try {
        const stage = root_id.substring(0, root_id.indexOf('_'));
        const topic_id = root_id.substring(root_id.indexOf('_') + 1);
        const thread = await models.OffchainThread.findOne({ where:{ stage, id: topic_id } });
        const threshold = (await models.OffchainTopic.findOne({ where: { id: thread.topic_id } })).token_threshold;
        const tokenBalance = await tokenBalanceCache.getBalance(chain.id, req.body.address);

        if (threshold && tokenBalance.lt(threshold)) return next(new Error(Errors.InsufficientTokenBalance));
      } catch (e) {
        log.error(`hasToken failed: ${e.message}`);
        return next(new Error(Errors.CouldNotFetchTokenBalance));
      }
    }
  }

  const plaintext = (() => {
    try {
      return renderQuillDeltaToText(JSON.parse(decodeURIComponent(text)));
    } catch (e) {
      return decodeURIComponent(text);
    }
  })();

  // TODO: 'let parentComment' here, saves one db query
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
    if (!parentCommentIsVisibleToUser) return next(new Error(Errors.InvalidParent));
  }

  if (!root_id) {
    return next(new Error(Errors.MissingRootId));
  }
  if ((!text || !text.trim())
      && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
    return next(new Error(Errors.MissingTextOrAttachment));
  }
  try {
    const quillDoc = JSON.parse(decodeURIComponent(text));
    if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === ''
        && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
      return next(new Error(Errors.MissingTextOrAttachment));
    }
  } catch (e) {
    // check always passes if the comment text isn't a Quill document
  }

  // New comments get an empty version history initialized, which is passed
  // the comment's first version, formatted on the backend with timestamps
  const firstVersion = {
    timestamp: moment(),
    body: decodeURIComponent(req.body.text)
  };
  const version_history : string[] = [ JSON.stringify(firstVersion) ];
  const commentContent = {
    root_id,
    child_comments: [],
    text,
    plaintext,
    version_history,
    address_id: author.id,
    chain: null,
    community: null,
    parent_id: null,
  };
  if (community) Object.assign(commentContent, { community: community.id });
  else if (chain) Object.assign(commentContent, { chain: chain.id });
  if (parent_id) Object.assign(commentContent, { parent_id });

  let comment;
  try {
    comment = await models.OffchainComment.create(commentContent);
  } catch (err) {
    return next(err);
  }

  let parentComment;
  if (parent_id) {
    // TODO: this query is unnecessary, we queried for parentComment earlier
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
    arr.push(+comment.id);
    parentComment.child_comments = arr;
    await parentComment.save();
  }

  // TODO: attachments can likely be handled like mentions (see lines 10 & 11)
  try {
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
  } catch (err) {
    return next(err);
  }

  // fetch attached objects to return to user
  // TODO: we should be able to assemble the object without another query
  const finalComment = await models.OffchainComment.findOne({
    where: { id: comment.id },
    include: [models.Address, models.OffchainAttachment],
  });

  // get parent entity if the comment is on an offchain thread
  // no parent entity if the comment is on an onchain entity
  let proposal;
  const [prefix, id] = finalComment.root_id.split('_');
  if (prefix === 'discussion') {
    proposal = await models.OffchainThread.findOne({
      where: { id }
    });
  } else if (prefix.includes('proposal') || prefix.includes('referendum') || prefix.includes('motion')) {
    // TODO: better check for on-chain proposal types
    const chainEntity = await proposalIdToEntity(models, chain.id, finalComment.root_id);
    if (!chainEntity) {
      // send a notification email if commenting on an invalid ChainEntity
      const msg = {
        to: 'founders@commonwealth.im',
        from: 'Commonwealth <no-reply@commonwealth.im>',
        subject: 'Missing ChainEntity',
        text: `Comment created on a missing ChainEntity ${finalComment.root_id} on ${chain.id}`,
      };
      sgMail.send(msg).then((result) => {
        log.error(`Sent notification: missing ChainEntity ${finalComment.root_id} on ${chain.id}`);
      }).catch((e) => {
        log.error(`Could not send notification: missing chainEntity ${finalComment.root_id} on ${chain.id}`);
      });
      // await finalComment.destroy();
      // return next(new Error(Errors.ChainEntityNotFound));
    }
    proposal = id;
  } else {
    log.error(`No matching proposal of thread for root_id ${finalComment.root_id}`);
  }

  if (!proposal) {
    await finalComment.destroy();
    return next(new Error(Errors.ThreadNotFound));
  }
  if (typeof proposal !== 'string' && proposal.read_only) {
    await finalComment.destroy();
    return next(new Error(Errors.CantCommentOnReadOnly));
  }

  // craft commonwealth url
  const cwUrl = typeof proposal === 'string'
    ? getProposalUrlWithoutObject(prefix, (finalComment.chain || finalComment.community), proposal, finalComment)
    : getProposalUrl(prefix, proposal, finalComment);
  const root_title = typeof proposal === 'string' ? '' : (proposal.title || '');

  // auto-subscribe comment author to reactions & child comments
  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewReaction,
    object_id: `comment-${finalComment.id}`,
    chain_id: finalComment.chain || null,
    community_id: finalComment.community || null,
    offchain_comment_id: finalComment.id,
    is_active: true,
  });

  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewComment,
    object_id: `comment-${finalComment.id}`,
    chain_id: finalComment.chain || null,
    community_id: finalComment.community || null,
    offchain_comment_id: finalComment.id,
    is_active: true,
  });

  // grab mentions to notify tagged users
  const bodyText = decodeURIComponent(text);
  let mentionedAddresses;
  try {
    const mentions = parseUserMentions(bodyText);
    if (mentions && mentions.length > 0) {
      mentionedAddresses = await Promise.all(mentions.map(async (mention) => {
        const user = await models.Address.findOne({
          where: {
            chain: mention[0],
            address: mention[1],
          },
          include: [ models.User, models.Role ]
        });
        return user;
      }));
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }
  } catch (e) {
    return next(new Error('Failed to parse mentions'));
  }

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(finalComment.Address.address);

  // dispatch notifications to root thread
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewComment,
    root_id,
    {
      created_at: new Date(),
      root_id: id,
      root_title,
      root_type: prefix,
      comment_id: +finalComment.id,
      comment_text: finalComment.text,
      chain_id: finalComment.chain,
      community_id: finalComment.community,
      author_address: finalComment.Address.address,
      author_chain: finalComment.Address.chain,
    },
    {
      user: finalComment.Address.address,
      author_chain: finalComment.Address.chain,
      url: cwUrl,
      title: root_title,
      chain: finalComment.chain,
      community: finalComment.community,
      body: finalComment.text,
    },
    req.wss,
    excludedAddrs
  );

  // if child comment, dispatch notification to parent author
  if (parent_id && parentComment) {
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.NewComment,
      `comment-${parent_id}`,
      {
        created_at: new Date(),
        root_id: +id,
        root_title,
        root_type: prefix,
        comment_id: +finalComment.id,
        comment_text: finalComment.text,
        parent_comment_id: +parent_id,
        parent_comment_text: parentComment.text,
        chain_id: finalComment.chain,
        community_id: finalComment.community,
        author_address: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
      },
      {
        user: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
        url: cwUrl,
        title: proposal.title || '',
        chain: finalComment.chain,
        community: finalComment.community,
        body: finalComment.text,
      },
      req.wss,
      excludedAddrs
    );
  }

  // notify mentioned users if they have permission to view the originating forum
  if (mentionedAddresses?.length > 0) {
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
          root_id: +id,
          root_title,
          root_type: prefix,
          comment_id: +finalComment.id,
          comment_text: finalComment.text,
          chain_id: finalComment.chain,
          community_id: finalComment.community,
          author_address: finalComment.Address.address,
          author_chain: finalComment.Address.chain,
        },
        {
          user: finalComment.Address.address,
          author_chain: finalComment.Address.chain,
          url: cwUrl,
          title: proposal.title || '',
          chain: finalComment.chain,
          community: finalComment.community,
          body: finalComment.text,
        }, // TODO: add webhook data for mentions
        req.wss,
        [ finalComment.Address.address ],
      );
    }));
  }

  // update author.last_active (no await)
  author.last_active = new Date();
  author.save();

  return res.json({ status: 'Success', result: finalComment.toJSON() });
};

export default createComment;
