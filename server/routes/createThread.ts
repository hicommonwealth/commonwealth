import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { NotificationCategories, ProposalType } from '../../shared/types';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl, renderQuillDeltaToText } from '../../shared/utils';
import { parseUserMentions } from '../util/parseUserMentions';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { factory, formatFilename } from '../../shared/logging';
import { sequelize } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  ForumMissingTitle: 'Forum posts must include a title',
  QuestionMissingTitle: 'Questions must include a title',
  RequestMissingTitle: 'Requests must include a title',
  NoBodyOrAttachments: 'Forum posts must include body or attachment',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only forum threads, questions, and requests supported',
  InsufficientTokenBalance: 'Users need to hold some of the community\'s tokens to post',
};

const createThread = async (
  models,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new Error(authorError));
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
      const userHasBalance = await tokenBalanceCache.hasToken(chain.id, req.body.address);
      if (!userHasBalance) return next(new Error(Errors.InsufficientTokenBalance));
    }
  }

  const { topic_name, topic_id, title, body, kind, stage, url, readOnly } = req.body;

  if (kind === 'forum') {
    if (!title || !title.trim()) {
      return next(new Error(Errors.ForumMissingTitle));
    }
    if ((!body || !body.trim()) && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
      return next(new Error(Errors.NoBodyOrAttachments));
    }
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === ''
          && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
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
  const firstVersion : any = {
    timestamp: moment(),
    author: req.body.author,
    body: decodeURIComponent(req.body.body)
  };
  const version_history : string[] = [ JSON.stringify(firstVersion) ];

  const threadContent = community ? {
    community: community.id,
    address_id: author.id,
    title,
    body,
    plaintext,
    version_history,
    kind,
    stage,
    url,
    read_only: readOnly,
  } : {
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

  // New Topic table entries created
  let thread_id;
  try {
    await sequelize.transaction(async (t) => {
      if (topic_id) {
        threadContent['topic_id'] = +topic_id;
      } else if (topic_name) {
        const [ offchainTopic ] = await models.OffchainTopic.findOrCreate({
          where: {
            name: topic_name,
            community_id: community?.id || null,
            chain_id: chain?.id || null,
          },
          transaction: t,
        });
        threadContent['topic_id'] = offchainTopic.id;
      } else {
        if ((community || chain).topics.length > 0) {
          throw new Error('Must pass a topic_name string and/or a numeric topic_id');
        }
      }

      const thread = await models.OffchainThread.create(threadContent, { transaction: t });
      thread_id = thread.id;

      // initialize view count store
      await models.OffchainViewCount.create({
        community: community?.id || null,
        chain: chain?.id || null,
        object_id: thread.id,
        view_count: 0,
      }, { transaction: t });

      // TODO: attachments can likely be handled like topics & mentions (see lines 11-14)
      if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
        await models.OffchainAttachment.create({
          attachable: 'thread',
          attachment_id: thread.id,
          url: req.body['attachments[]'],
          description: 'image',
        }, { transaction: t });
      } else if (req.body['attachments[]']) {
        await Promise.all(req.body['attachments[]'].map((u) => models.OffchainAttachment.create({
          attachable: 'thread',
          attachment_id: thread.id,
          url: u,
          description: 'image',
        }, { transaction: t })));
      }

      // auto-subscribe thread creator to comments & reactions
      await models.Subscription.create({
        subscriber_id: req.user.id,
        category_id: NotificationCategories.NewComment,
        object_id: `discussion_${thread.id}`,
        offchain_thread_id: thread.id,
        community_id: thread.community || null,
        chain_id: thread.chain || null,
        is_active: true,
      }, { transaction: t });
      await models.Subscription.create({
        subscriber_id: req.user.id,
        category_id: NotificationCategories.NewReaction,
        object_id: `discussion_${thread.id}`,
        offchain_thread_id: thread.id,
        community_id: thread.community || null,
        chain_id: thread.chain || null,
        is_active: true,
      }, { transaction: t });

      // auto-subscribe NewThread subscribers to NewComment as well
      // findOrCreate because redundant creation if author is also subscribed to NewThreads
      const location = thread.community || thread.chain;
      const subscribers = await models.Subscription.findAll({
        where: {
          category_id: NotificationCategories.NewThread,
          object_id: location,
        }
      }, { transaction: t });
      await Promise.all(subscribers.map((s) => {
        return models.Subscription.findOrCreate({
          where: {
            subscriber_id: s.subscriber_id,
            category_id: NotificationCategories.NewComment,
            object_id: `discussion_${thread.id}`,
            offchain_thread_id: thread.id,
            community_id: thread.community || null,
            chain_id: thread.chain || null,
            is_active: true,
          },
          transaction: t,
        });
      }));

      // grab mentions to notify tagged users
      const bodyText = decodeURIComponent(body);
      let mentionedAddresses;
      const mentions = parseUserMentions(bodyText);
      if (mentions?.length > 0) {
        mentionedAddresses = await Promise.all(mentions.map(async (mention) => {
          return models.Address.findOne({
            where: {
              chain: mention[0],
              address: mention[1],
            },
            include: [ models.User, models.Role ]
          }, { transaction: t });
        }));
        // filter null results
        mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
      }

      const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
      excludedAddrs.push(author.address);

      // dispatch notifications to subscribers of the given chain/community
      await models.Subscription.emitNotifications(
        models,
        NotificationCategories.NewThread,
        location,
        {
          created_at: new Date(),
          root_id: +thread.id,
          root_type: ProposalType.OffchainThread,
          root_title: thread.title,
          comment_text: thread.body,
          chain_id: thread.chain,
          community_id: thread.community,
          author_address: author.address,
          author_chain: author.chain,
        },
        {
          user: author.address,
          author_chain: author.chain,
          url: getProposalUrl('discussion', thread),
          title: req.body.title,
          bodyUrl: req.body.url,
          chain: thread.chain,
          community: thread.community,
          body: thread.body,
        },
        req.wss,
        excludedAddrs,
      );

      // notify mentioned users, given permissions are in place
      if (mentionedAddresses?.length > 0) await Promise.all(mentionedAddresses.map(async (mentionedAddress) => {
        if (!mentionedAddress.User) return; // some Addresses may be missing users, e.g. if the user removed the address

        let shouldNotifyMentionedUser = true;
        if (thread.community) {
          const originCommunity = await models.OffchainCommunity.findOne({
            where: { id: thread.community }
          }, { transaction: t });
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
            root_id: thread.id,
            root_type: ProposalType.OffchainThread,
            root_title: thread.title,
            comment_text: thread.body,
            chain_id: thread.chain,
            community_id: thread.community,
            author_address: author.address,
            author_chain: author.chain,
          },
          {
            user: author.address,
            url: getProposalUrl('discussion', thread),
            title: req.body.title,
            bodyUrl: req.body.url,
            chain: thread.chain,
            community: thread.community,
            body: thread.body,
          },
          req.wss,
          [ author.address ],
        );
      }));

      // update author.last_active (no await)
      author.last_active = new Date();
      author.save({ transaction: t });
    });
  } catch (e) {
    return next(new Error(e));
  }

  // fetch final thread for return
  const finalThread = await models.OffchainThread.findOne({
    where: { id: thread_id },
    include: [
      { model: models.Address, as: 'Address' },
      models.OffchainAttachment,
      { model: models.OffchainTopic, as: 'topic' }
    ],
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default createThread;
