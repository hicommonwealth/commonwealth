import { AppError, ServerError } from 'common-common/src/errors';

import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
  ProposalType,
} from 'common-common/src/types';
import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { Action, PermissionError } from '../../shared/permissions';
import { findAllRoles, isAddressPermitted } from '../util/roles';
import type { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { getThreadUrl, renderQuillDeltaToText } from '../../shared/utils';
import { sequelize } from '../database';
import type { DB } from '../models';
import type { ThreadInstance } from '../models/thread';
import type BanCache from '../util/banCheckCache';
import emitNotifications from '../util/emitNotifications';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { parseUserMentions } from '../util/parseUserMentions';
import checkRule from '../util/rules/checkRule';
import type RuleCache from '../util/rules/ruleCache';
import validateTopicThreshold from '../util/validateTopicThreshold';

export const Errors = {
  DiscussionMissingTitle: 'Discussion posts must include a title',
  NoBodyOrAttachments: 'Discussion posts must include body or attachment',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only discussion and link posts supported',
  InsufficientTokenBalance:
    "Users need to hold some of the community's tokens to post",
  BalanceCheckFailed: 'Could not verify user token balance',
  RuleCheckFailed: 'Rule check failed',
};

const dispatchHooks = async (
  models: DB,
  req: Request,
  finalThread: ThreadInstance
) => {
  // auto-subscribe thread creator to comments & reactions
  try {
    await models.Subscription.create({
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewComment,
      object_id: `discussion_${finalThread.id}`,
      offchain_thread_id: finalThread.id,
      chain_id: finalThread.chain,
      is_active: true,
    });
    await models.Subscription.create({
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewReaction,
      object_id: `discussion_${finalThread.id}`,
      offchain_thread_id: finalThread.id,
      chain_id: finalThread.chain,
      is_active: true,
    });
  } catch (err) {
    throw new ServerError(err);
  }

  // auto-subscribe NewThread subscribers to NewComment as well
  // findOrCreate because redundant creation if author is also subscribed to NewThreads
  const location = finalThread.chain;
  try {
    await sequelize.query(
      `
    WITH irrelevant_subs AS (
      SELECT id
      FROM "Subscriptions"
      WHERE subscriber_id IN (
        SELECT subscriber_id FROM "Subscriptions" WHERE category_id = ? AND object_id = ?
      ) AND category_id = ? AND object_id = ? AND offchain_thread_id = ? AND chain_id = ? AND is_active = true
    )
    INSERT INTO "Subscriptions"
    (subscriber_id, category_id, object_id, offchain_thread_id, chain_id, is_active, created_at, updated_at)
    SELECT subscriber_id, ? as category_id, ? as object_id, ? as offchain_thread_id, ? as
     chain_id, true as is_active, NOW() as created_at, NOW() as updated_at
    FROM "Subscriptions"
    WHERE category_id = ? AND object_id = ? AND id NOT IN (SELECT id FROM irrelevant_subs);
  `,
      {
        raw: true,
        type: 'RAW',
        replacements: [
          NotificationCategories.NewThread,
          location,
          NotificationCategories.NewComment,
          `discussion_${finalThread.id}`,
          finalThread.id,
          finalThread.chain,
          NotificationCategories.NewComment,
          `discussion_${finalThread.id}`,
          finalThread.id,
          finalThread.chain,
          NotificationCategories.NewThread,
          location,
        ],
      }
    );
  } catch (e) {
    console.log(e);
  }

  // grab mentions to notify tagged users
  const bodyText = decodeURIComponent(req.body.body);
  let mentionedAddresses;
  try {
    const mentions = parseUserMentions(bodyText);
    if (mentions?.length > 0) {
      mentionedAddresses = await Promise.all(
        mentions.map(async (mention) => {
          try {
            return models.Address.findOne({
              where: {
                chain: mention[0] || null,
                address: mention[1] || null,
              },
              include: [models.User, models.RoleAssignment],
            });
          } catch (err) {
            throw new ServerError(err);
          }
        })
      );
      // filter null results
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }
  } catch (e) {
    throw new ServerError('Failed to parse mentions');
  }

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(finalThread.Address.address);

  // dispatch notifications to subscribers of the given chain
  emitNotifications(
    models,
    NotificationCategories.NewThread,
    location,
    {
      created_at: new Date(),
      thread_id: finalThread.id,
      root_type: ProposalType.Thread,
      root_title: finalThread.title,
      comment_text: finalThread.body,
      chain_id: finalThread.chain,
      author_address: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
    },
    {
      user: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
      url: getThreadUrl('discussion', finalThread),
      title: req.body.title,
      bodyUrl: req.body.url,
      chain: finalThread.chain,
      body: finalThread.body,
    },
    excludedAddrs
  );

  // notify mentioned users, given permissions are in place
  if (mentionedAddresses?.length > 0)
    mentionedAddresses.map((mentionedAddress) => {
      if (!mentionedAddress.User) return; // some Addresses may be missing users, e.g. if the user removed the address

      // dispatch notification emitting
      return emitNotifications(
        models,
        NotificationCategories.NewMention,
        `user-${mentionedAddress.User.id}`,
        {
          created_at: new Date(),
          thread_id: finalThread.id,
          root_type: ProposalType.Thread,
          root_title: finalThread.title,
          comment_text: finalThread.body,
          chain_id: finalThread.chain,
          author_address: finalThread.Address.address,
          author_chain: finalThread.Address.chain,
        },
        null,
        [finalThread.Address.address]
      );
    });
};

const createThread = async (
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

  const permission_error = await isAddressPermitted(
    models,
    author.id,
    chain.id,
    Action.CREATE_THREAD
  );
  if (!permission_error) {
    return next(new AppError(PermissionError.NOT_PERMITTED));
  }

  const { topic_name, title, body, kind, stage, url, readOnly } = req.body;
  let { topic_id } = req.body;

  if (kind === 'discussion') {
    if (!title || !title.trim()) {
      return next(new AppError(Errors.DiscussionMissingTitle));
    }
    if (
      (!body || !body.trim()) &&
      (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
    ) {
      return next(new AppError(Errors.NoBodyOrAttachments));
    }
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (
        quillDoc.ops.length === 1 &&
        quillDoc.ops[0].insert.trim() === '' &&
        (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
      ) {
        return next(new AppError(Errors.NoBodyOrAttachments));
      }
    } catch (e) {
      // check always passes if the body isn't a Quill document
    }
  } else if (kind === 'link') {
    if (!title?.trim() || !url?.trim()) {
      return next(new Error(Errors.LinkMissingTitleOrUrl));
    }
  } else {
    return next(new AppError(Errors.UnsupportedKind));
  }

  // check if banned
  const [canInteract, banError] = await banCache.checkBan({
    chain: chain.id,
    address: author.address,
  });
  if (!canInteract) {
    return next(new AppError(banError));
  }

  // Render a copy of the thread to plaintext for the search indexer
  const plaintext = (() => {
    try {
      return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
    } catch (e) {
      return decodeURIComponent(body);
    }
  })();

  // New threads get an empty version history initialized, which is passed
  // the thread's first version, formatted on the frontend with timestamps
  const firstVersion: any = {
    timestamp: moment(),
    author: req.body.author,
    body: decodeURIComponent(req.body.body),
  };
  const version_history: string[] = [JSON.stringify(firstVersion)];

  const threadContent = {
    chain: chain.id,
    address_id: author.id,
    title,
    body,
    plaintext,
    version_history,
    kind,
    stage,
    url,
    read_only: readOnly || false,
  };

  // begin essential database changes within transaction
  const finalThread = await sequelize.transaction(async (transaction) => {
    // New Topic table entries created
    if (topic_id) {
      threadContent['topic_id'] = +topic_id;
    } else if (topic_name) {
      let topic;
      try {
        [topic] = await models.Topic.findOrCreate({
          where: {
            name: topic_name,
            chain_id: chain?.id || null,
          },
          transaction,
        });
        threadContent['topic_id'] = topic.id;
        topic_id = topic.id;
      } catch (err) {
        return next(err);
      }
    } else {
      if (chain.topics?.length) {
        return next(
          Error('Must pass a topic_name string and/or a numeric topic_id')
        );
      }
    }

    if (
      chain &&
      (chain.type === ChainType.Token ||
        chain.network === ChainNetwork.Ethereum)
    ) {
      // skip check for admins
      const isAdmin = await findAllRoles(
        models,
        { where: { address_id: author.id } },
        chain.id,
        ['admin']
      );
      if (!req.user.isAdmin && isAdmin.length === 0) {
        const canReact = await validateTopicThreshold(
          tokenBalanceCache,
          models,
          topic_id,
          req.body.address
        );
        if (!canReact) {
          return next(new AppError(Errors.BalanceCheckFailed));
        }
      }
    }

    const topic = await models.Topic.findOne({
      where: {
        id: topic_id,
      },
      attributes: ['rule_id'],
    });
    if (topic?.rule_id) {
      const passesRules = await checkRule(
        ruleCache,
        models,
        topic.rule_id,
        author.address,
        transaction
      );
      if (!passesRules) {
        return next(new AppError(Errors.RuleCheckFailed));
      }
    }

    let thread: ThreadInstance;
    try {
      thread = await models.Thread.create(threadContent, {
        transaction,
      });
    } catch (err) {
      return next(new ServerError(err));
    }
    // TODO: attachments can likely be handled like topics & mentions (see lines 11-14)
    try {
      if (
        req.body['attachments[]'] &&
        typeof req.body['attachments[]'] === 'string'
      ) {
        await models.Attachment.create(
          {
            attachable: 'thread',
            attachment_id: thread.id,
            url: req.body['attachments[]'],
            description: 'image',
          },
          { transaction }
        );
      } else if (req.body['attachments[]']) {
        const data = [];
        req.body['attachments[]'].map((u) => {
          data.push({
            attachable: 'thread',
            attachment_id: thread.id,
            url: u,
            description: 'image',
          });
        });

        await models.Attachment.bulkCreate(data, { transaction });
      }
    } catch (err) {
      return next(err);
    }

    // update author's last activity based on thread creation
    author.last_active = new Date();
    await author.save({ transaction });

    try {
      // re-fetch thread once created
      return await models.Thread.findOne({
        where: { id: thread.id },
        include: [
          { model: models.Address, as: 'Address' },
          models.Attachment,
          { model: models.Topic, as: 'topic' },
        ],
        transaction,
      });
    } catch (err) {
      return next(err);
    }
  });

  // exit early on error, do not emit notifications
  if (!finalThread) return;

  // dispatch post-init hooks asynchronously (subscribing etc), then return immediately
  // TODO: this blocks the event loop -- need to dispatch to a worker so we can continue listening to web queries
  dispatchHooks(models, req, finalThread);

  if (process.env.NODE_ENV !== 'test') {
    mixpanelTrack({
      event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
      community: chain.id,
      isCustomDomain: null,
    });
  }
  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default createThread;
