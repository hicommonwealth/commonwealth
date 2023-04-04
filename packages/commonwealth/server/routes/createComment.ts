import sgMail from '@sendgrid/mail';
import { AppError, ServerError } from 'common-common/src/errors';
import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
  ProposalType,
} from 'common-common/src/types';
import type { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { factory, formatFilename } from 'common-common/src/logging';
import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

import {
  getProposalUrl,
  getProposalUrlWithoutObject,
  renderQuillDeltaToText,
} from '../../shared/utils';
import { SENDGRID_API_KEY } from '../config';
import type { DB } from '../models';
import type BanCache from '../util/banCheckCache';
import emitNotifications from '../util/emitNotifications';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { parseUserMentions } from '../util/parseUserMentions';
import { findAllRoles } from '../util/roles';
import checkRule from '../util/rules/checkRule';
import type RuleCache from '../util/rules/ruleCache';
import validateTopicThreshold from '../util/validateTopicThreshold';
import { verifyComment } from '../../shared/canvas/serverVerify';

sgMail.setApiKey(SENDGRID_API_KEY);

const log = factory.getLogger(formatFilename(__filename));
export const Errors = {
  MissingRootId: 'Must provide valid root_id',
  InvalidParent: 'Invalid parent',
  MissingTextOrAttachment: 'Must provide text or attachment',
  ThreadNotFound: 'Cannot comment; thread not found',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  InsufficientTokenBalance:
    "Users need to hold some of the community's tokens to comment",
  BalanceCheckFailed: 'Could not verify user token balance',
  NestingTooDeep: 'Comments can only be nested 2 levels deep',
  RuleCheckFailed: 'Rule check failed',
};

const createComment = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  ruleCache: RuleCache,
  banCache: BanCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  const author = req.address;

  const {
    parent_id,
    root_id,
    text,
    canvas_action,
    canvas_session,
    canvas_hash,
  } = req.body;

  if (!root_id || root_id.indexOf('_') === -1) {
    return next(new AppError(Errors.MissingRootId));
  }
  if (
    (!text || !text.trim()) &&
    (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
  ) {
    return next(new AppError(Errors.MissingTextOrAttachment));
  }

  // check if banned
  const [canInteract, banError] = await banCache.checkBan({
    chain: chain.id,
    address: author.address,
  });
  if (!canInteract) {
    return next(new AppError(banError));
  }

  let parentComment;
  if (parent_id) {
    // check that parent comment is in the same community
    parentComment = await models.Comment.findOne({
      where: {
        id: parent_id,
        chain: chain.id,
      },
    });
    if (!parentComment) return next(new AppError(Errors.InvalidParent));

    // Backend check to ensure comments are never nested more than three levels deep:
    // top-level, child, and grandchild
    if (parentComment.parent_id) {
      const grandparentComment = await models.Comment.findOne({
        where: {
          id: parentComment.parent_id,
          chain: chain.id,
        },
      });
      if (grandparentComment?.parent_id) {
        return next(new AppError(Errors.NestingTooDeep));
      }
    }
  }

  const thread_id = root_id.substring(root_id.indexOf('_') + 1);
  const thread = await models.Thread.findOne({
    where: { id: thread_id },
  });

  if (thread?.id) {
    const topic = await models.Topic.findOne({
      include: {
        model: models.Thread,
        where: { id: thread.id },
        required: true,
        as: 'threads',
      },
      attributes: ['rule_id'],
    });
    if (topic?.rule_id) {
      const passesRules = await checkRule(
        ruleCache,
        models,
        topic.rule_id,
        author.address
      );
      if (!passesRules) {
        return next(new AppError(Errors.RuleCheckFailed));
      }
    }
  }

  if (
    chain &&
    (chain.type === ChainType.Token || chain.network === ChainNetwork.Ethereum)
  ) {
    // skip check for admins
    const isAdmin = await findAllRoles(
      models,
      { where: { address_id: author.id } },
      chain.id,
      ['admin']
    );
    if (thread?.topic_id && !req.user.isAdmin && isAdmin.length === 0) {
      try {
        const canReact = await validateTopicThreshold(
          tokenBalanceCache,
          models,
          thread.topic_id,
          req.body.address
        );
        if (!canReact) {
          return next(new AppError(Errors.BalanceCheckFailed));
        }
      } catch (e) {
        log.error(`hasToken failed: ${e.message}`);
        return next(new ServerError(Errors.BalanceCheckFailed));
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

  try {
    const quillDoc = JSON.parse(decodeURIComponent(text));
    if (
      quillDoc.ops.length === 1 &&
      quillDoc.ops[0].insert.trim() === '' &&
      (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
    ) {
      return next(new AppError(Errors.MissingTextOrAttachment));
    }
  } catch (e) {
    // check always passes if the comment text isn't a Quill document
  }

  await verifyComment(canvas_action, canvas_session, canvas_hash, { thread_id, text, address: author.address, chain: chain.id });

  // New comments get an empty version history initialized, which is passed
  // the comment's first version, formatted on the backend with timestamps
  const firstVersion = {
    timestamp: moment(),
    body: decodeURIComponent(req.body.text),
  };
  const version_history: string[] = [JSON.stringify(firstVersion)];
  const commentContent = {
    root_id,
    text,
    plaintext,
    version_history,
    address_id: author.id,
    chain: chain.id,
    parent_id: null,
    canvas_action,
    canvas_session,
    canvas_hash,
  };
  if (parent_id) Object.assign(commentContent, { parent_id });

  let comment;
  try {
    comment = await models.Comment.create(commentContent);
  } catch (err) {
    return next(err);
  }

  // TODO: attachments can likely be handled like mentions (see lines 10 & 11)
  try {
    if (
      req.body['attachments[]'] &&
      typeof req.body['attachments[]'] === 'string'
    ) {
      await models.Attachment.create({
        attachable: 'comment',
        attachment_id: comment.id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(
        req.body['attachments[]'].map((url) =>
          models.Attachment.create({
            attachable: 'comment',
            attachment_id: comment.id,
            url,
            description: 'image',
          })
        )
      );
    }
  } catch (err) {
    return next(err);
  }

  // fetch attached objects to return to user
  // TODO: we should be able to assemble the object without another query
  const finalComment = await models.Comment.findOne({
    where: { id: comment.id },
    include: [models.Address, models.Attachment],
  });

  // get parent entity if the comment is on a thread
  // no parent entity if the comment is on an onchain entity
  let proposal;
  const [prefix, id] = finalComment.root_id.split('_') as [
    ProposalType,
    string
  ];
  if (prefix === ProposalType.Thread) {
    proposal = await models.Thread.findOne({
      where: { id },
    });
    // TODO: put this part on the front-end and pass in just the chain-entity id
    //  so we can check if it exists for the email part --- similar for reaction
  } else if (
    prefix.includes('proposal') ||
    prefix.includes('referendum') ||
    prefix.includes('motion')
  ) {
    proposal = id;
  } else {
    log.error(
      `No matching proposal of thread for root_id ${finalComment.root_id}`
    );
  }

  if (!proposal) {
    await finalComment.destroy();
    return next(new AppError(Errors.ThreadNotFound));
  }
  if (typeof proposal !== 'string' && proposal.read_only) {
    await finalComment.destroy();
    return next(new AppError(Errors.CantCommentOnReadOnly));
  }

  // craft commonwealth url
  const cwUrl =
    typeof proposal === 'string'
      ? getProposalUrlWithoutObject(
          prefix,
          finalComment.chain,
          proposal,
          finalComment
        )
      : getProposalUrl(prefix, proposal, finalComment);
  const root_title = typeof proposal === 'string' ? '' : proposal.title || '';

  // auto-subscribe comment author to reactions & child comments
  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewReaction,
    object_id: `comment-${finalComment.id}`,
    chain_id: finalComment.chain || null,
    offchain_comment_id: finalComment.id,
    is_active: true,
  });

  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewComment,
    object_id: `comment-${finalComment.id}`,
    chain_id: finalComment.chain || null,
    offchain_comment_id: finalComment.id,
    is_active: true,
  });

  // grab mentions to notify tagged users
  const bodyText = decodeURIComponent(text);
  let mentionedAddresses;
  try {
    const mentions = parseUserMentions(bodyText);
    if (mentions && mentions.length > 0) {
      mentionedAddresses = await Promise.all(
        mentions.map(async (mention) => {
          const user = await models.Address.findOne({
            where: {
              chain: mention[0] || null,
              address: mention[1],
            },
            include: [models.User, models.RoleAssignment],
          });
          return user;
        })
      );
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }
  } catch (e) {
    return next(new AppError('Failed to parse mentions'));
  }

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(finalComment.Address.address);

  // dispatch notifications to root thread
  emitNotifications(
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
      author_address: finalComment.Address.address,
      author_chain: finalComment.Address.chain,
    },
    {
      user: finalComment.Address.address,
      author_chain: finalComment.Address.chain,
      url: cwUrl,
      title: root_title,
      chain: finalComment.chain,
      body: finalComment.text,
    },
    excludedAddrs
  );

  // if child comment, dispatch notification to parent author
  if (parent_id && parentComment) {
    emitNotifications(
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
        author_address: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
      },
      {
        user: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
        url: cwUrl,
        title: proposal.title || '',
        chain: finalComment.chain,
        body: finalComment.text,
      },
      excludedAddrs
    );
  }

  // notify mentioned users if they have permission to view the originating forum
  if (mentionedAddresses?.length > 0) {
    mentionedAddresses.map((mentionedAddress) => {
      if (!mentionedAddress.User) return; // some Addresses may be missing users, e.g. if the user removed the address

      const shouldNotifyMentionedUser = true;
      if (shouldNotifyMentionedUser)
        emitNotifications(
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
            author_address: finalComment.Address.address,
            author_chain: finalComment.Address.chain,
          },
          {
            user: finalComment.Address.address,
            author_chain: finalComment.Address.chain,
            url: cwUrl,
            title: proposal.title || '',
            chain: finalComment.chain,
            body: finalComment.text,
          }, // TODO: add webhook data for mentions
          [finalComment.Address.address]
        );
    });
  }

  // update author.last_active (no await)
  author.last_active = new Date();
  author.save();

  // update proposal updated_at timestamp
  if (prefix === ProposalType.Thread) {
    proposal.last_commented_on = Date.now();
    proposal.save();
  }

  if (process.env.NODE_ENV !== 'test') {
    mixpanelTrack({
      event: MixpanelCommunityInteractionEvent.CREATE_COMMENT,
      community: chain.id,
      isCustomDomain: null,
    });
  }

  return res.json({ status: 'Success', result: finalComment.toJSON() });
};

export default createComment;
