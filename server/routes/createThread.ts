import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import {
  NotificationCategories,
  ProposalType,
  ChainType,
} from '../../shared/types';

import validateChain from '../util/validateChain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl, renderQuillDeltaToText } from '../../shared/utils';
import { parseUserMentions } from '../util/parseUserMentions';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { DB, sequelize } from '../database';
import { factory, formatFilename } from '../../shared/logging';
import { OffchainThreadInstance } from '../models/offchain_thread';
import { ServerError } from '../util/errors';
import { mixpanelTrack } from '../util/mixpanelUtil';
import {
  MixpanelCommunityInteractionEvent,
  MixpanelCommunityInteractionPayload,
} from '../../shared/analytics/types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  ForumMissingTitle: 'Forum posts must include a title',
  QuestionMissingTitle: 'Questions must include a title',
  RequestMissingTitle: 'Requests must include a title',
  NoBodyOrAttachments: 'Forum posts must include body or attachment',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only forum threads, questions, and requests supported',
  InsufficientTokenBalance:
    "Users need to hold some of the community's tokens to post",
  BalanceCheckFailed: 'Could not verify user token balance',
};

const dispatchHooks = async (
  models: DB,
  req: Request,
  finalThread: OffchainThreadInstance
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
    INSERT INTO "Subscriptions"(subscriber_id, category_id, object_id, offchain_thread_id, chain_id, is_active, created_at, updated_at)
    SELECT subscriber_id, ? as category_id, ? as object_id, ? as offchain_thread_id, ? as chain_id, true as is_active, NOW() as created_at, NOW() as updated_at
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
              include: [models.User, models.Role],
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
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewThread,
    location,
    {
      created_at: new Date(),
      root_id: finalThread.id,
      root_type: ProposalType.OffchainThread,
      root_title: finalThread.title,
      comment_text: finalThread.body,
      chain_id: finalThread.chain,
      author_address: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
    },
    {
      user: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
      url: getProposalUrl('discussion', finalThread),
      title: req.body.title,
      bodyUrl: req.body.url,
      chain: finalThread.chain,
      body: finalThread.body,
    },
    req.wss,
    excludedAddrs
  );

  // notify mentioned users, given permissions are in place
  if (mentionedAddresses?.length > 0)
    mentionedAddresses.map((mentionedAddress) => {
      if (!mentionedAddress.User) return; // some Addresses may be missing users, e.g. if the user removed the address

      // dispatch notification emitting
      return models.Subscription.emitNotifications(
        models,
        NotificationCategories.NewMention,
        `user-${mentionedAddress.User.id}`,
        {
          created_at: new Date(),
          root_id: finalThread.id,
          root_type: ProposalType.OffchainThread,
          root_title: finalThread.title,
          comment_text: finalThread.body,
          chain_id: finalThread.chain,
          author_address: finalThread.Address.address,
          author_chain: finalThread.Address.chain,
        },
        {
          user: finalThread.Address.address,
          url: getProposalUrl('discussion', finalThread),
          title: req.body.title,
          bodyUrl: req.body.url,
          chain: finalThread.chain,
          body: finalThread.body,
        },
        req.wss,
        [finalThread.Address.address]
      );
    });
};

const createThread = async (
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);

  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new Error(authorError));

  const { topic_name, title, body, kind, stage, url, readOnly } = req.body;
  let { topic_id } = req.body;

  if (kind === 'forum') {
    if (!title || !title.trim()) {
      return next(new Error(Errors.ForumMissingTitle));
    }
    if (
      (!body || !body.trim()) &&
      (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
    ) {
      return next(new Error(Errors.NoBodyOrAttachments));
    }
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (
        quillDoc.ops.length === 1 &&
        quillDoc.ops[0].insert.trim() === '' &&
        (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
      ) {
        return next(new Error(Errors.NoBodyOrAttachments));
      }
    } catch (e) {
      // check always passes if the body isn't a Quill document
    }
  } else if (kind === 'question') {
    if (!title || !title.trim()) {
      return next(new Error(Errors.QuestionMissingTitle));
    }
  } else if (kind === 'request') {
    if (!title || !title.trim()) {
      return next(new Error(Errors.RequestMissingTitle));
    }
  } else if (kind === 'link') {
    if (!title || !title.trim() || !url) {
      return next(new Error(Errors.LinkMissingTitleOrUrl));
    }
  } else {
    return next(new Error(Errors.UnsupportedKind));
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
      let offchainTopic;
      try {
        [offchainTopic] = await models.OffchainTopic.findOrCreate({
          where: {
            name: topic_name,
            chain_id: chain?.id || null,
          },
          transaction,
        });
        threadContent['topic_id'] = offchainTopic.id;
        topic_id = offchainTopic.id;
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

    if (chain && chain.type === ChainType.Token) {
      // skip check for admins
      const isAdmin = await models.Role.findAll({
        where: {
          address_id: author.id,
          chain_id: chain.id,
          permission: ['admin'],
        },
        transaction,
      });
      if (!req.user.isAdmin && isAdmin.length === 0) {
        const canReact = await tokenBalanceCache.validateTopicThreshold(
          topic_id,
          req.body.address
        );
        if (!canReact) {
          return next(new Error(Errors.BalanceCheckFailed));
        }
      }
    }

    let thread: OffchainThreadInstance;
    try {
      thread = await models.OffchainThread.create(threadContent, {
        transaction,
      });
    } catch (err) {
      return next(new Error(err));
    }
    // TODO: attachments can likely be handled like topics & mentions (see lines 11-14)
    try {
      if (
        req.body['attachments[]'] &&
        typeof req.body['attachments[]'] === 'string'
      ) {
        await models.OffchainAttachment.create(
          {
            attachable: 'thread',
            attachment_id: thread.id,
            url: req.body['attachments[]'],
            description: 'image',
          },
          { transaction }
        );
      } else if (req.body['attachments[]']) {
        await Promise.all(
          req.body['attachments[]'].map((u) =>
            models.OffchainAttachment.create(
              {
                attachable: 'thread',
                attachment_id: thread.id,
                url: u,
                description: 'image',
              },
              { transaction }
            )
          )
        );
      }
    } catch (err) {
      return next(err);
    }

    // initialize view count
    await models.OffchainViewCount.create(
      {
        chain: thread.chain,
        object_id: thread.id,
        view_count: 0,
      },
      { transaction }
    );

    // update author's last activity based on thread creation
    author.last_active = new Date();
    await author.save({ transaction });

    try {
      // re-fetch thread once created
      return await models.OffchainThread.findOne({
        where: { id: thread.id },
        include: [
          { model: models.Address, as: 'Address' },
          models.OffchainAttachment,
          { model: models.OffchainTopic, as: 'topic' },
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

  mixpanelTrack({
    event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
    community: chain.id,
    isCustomDomain: null,
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default createThread;
