/* eslint-disable prefer-const */
import { AppError, ServerError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
} from 'common-common/src/types';
/* eslint-disable dot-notation */
import type { NextFunction, Request, Response } from 'express';
import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { getThreadUrl } from '../../shared/utils';
import type { DB } from '../models';
import type BanCache from '../util/banCheckCache';
import emitNotifications from '../util/emitNotifications';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { findAllRoles } from '../util/roles';
import checkRule from '../util/rules/checkRule';
import type RuleCache from '../util/rules/ruleCache';
import validateTopicThreshold from '../util/validateTopicThreshold';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoPostId: 'Must provide a comment or thread ID',
  NoReaction: 'Must provide a reaction',
  NoCommentMatch: 'No matching comment found',
  NoProposalMatch: 'No matching proposal found',
  InsufficientTokenBalance:
    "Users need to hold some of the community's tokens to react",
  BalanceCheckFailed: 'Could not verify user token balance',
  RuleCheckFailed: 'Rule check failed',
};

const createReaction = async (
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
    reaction,
    comment_id,
    proposal_id,
    thread_id,
    chain_entity_id,
    canvas_action,
    canvas_session,
    canvas_hash,
  } = req.body;

  if (!thread_id && !proposal_id && !comment_id) {
    return next(new AppError(Errors.NoPostId));
  }
  if (!reaction) {
    return next(new AppError(Errors.NoReaction));
  }

  let thread;
  if (thread_id) {
    thread = await models.Thread.findOne({
      where: { id: thread_id },
    });
  } else if (comment_id) {
    const threadId = (
      await models.Comment.findOne({ where: { id: comment_id } })
    ).thread_id;
    thread = await models.Thread.findOne({
      where: { id: threadId },
    });
  }

  if (thread) {
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

  // check if author can react
  if (chain) {
    const [canInteract, banError] = await banCache.checkBan({
      chain: chain.id,
      address: req.body.address,
    });
    if (!canInteract) {
      return next(new AppError(banError));
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
    if (thread && !req.user.isAdmin && isAdmin.length === 0) {
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

  let proposal;
  let root_type;

  const options = {
    reaction,
    address_id: author.id,
    chain: chain.id,
    canvas_action,
    canvas_session,
    canvas_hash,
  };

  if (thread_id) options['thread_id'] = thread_id;
  else if (proposal_id) {
    if (!chain_entity_id) return next(new AppError(Errors.NoProposalMatch));
    const [id] = proposal_id.split('_');
    proposal = { id };
    root_type = proposal_id.split('_')[0];
    options['proposal_id'] = proposal_id;
  } else if (comment_id) options['comment_id'] = comment_id;

  let finalReaction;
  let created;

  try {
    [finalReaction, created] = await models.Reaction.findOrCreate({
      where: options,
      defaults: options,
      include: [models.Address],
    });

    if (created)
      finalReaction = await models.Reaction.findOne({
        where: options,
        include: [models.Address],
      });
  } catch (err) {
    return next(new ServerError(err));
  }

  let comment;
  let cwUrl;
  if (comment_id) {
    comment = await models.Comment.findByPk(Number(comment_id));
    if (!comment) return next(new AppError(Errors.NoCommentMatch));

    // Test on variety of comments to ensure root relation + type
    const id = comment.thread_id;
    proposal = await models.Thread.findOne({
      where: { id },
    });
    cwUrl = getThreadUrl(proposal, comment);
  } else if (thread_id) {
    proposal = await models.Thread.findByPk(Number(thread_id));
    if (!proposal) return next(new AppError(Errors.NoProposalMatch));
    cwUrl = getThreadUrl(proposal, comment);
    root_type = 'discussion';
  }

  const root_title = typeof proposal === 'string' ? '' : proposal.title || '';

  // dispatch notifications
  const notification_data = {
    created_at: new Date(),
    thread_id: comment
      ? comment.thread_id
      : proposal instanceof models.Thread
      ? proposal.id
      : proposal?.thread_id,
    root_title,
    root_type,
    chain_id: finalReaction.chain,
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

  emitNotifications(
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
      body: comment_id ? comment.text : '',
    },
    [finalReaction.Address.address]
  );

  // update author.last_active (no await)
  author.last_active = new Date();
  author.save();

  if (process.env.NODE_ENV !== 'test') {
    mixpanelTrack({
      event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
      community: chain.id,
      isCustomDomain: null,
    });
  }

  return res.json({ status: 'Success', result: finalReaction.toJSON() });
};

export default createReaction;
