import moment from 'moment';

import { Request, Response, NextFunction } from 'express';
import { NotificationCategories, ProposalType } from '../../shared/types';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl, renderQuillDeltaToText } from '../../shared/utils';
import { parseUserMentions } from '../util/parseUserMentions';
import TokenBalanceCache from '../util/tokenBalanceCache';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  ForumMissingTitle: 'Forum posts must include a title',
  QuestionMissingTitle: 'Questions must include a title',
  RequestMissingTitle: 'Requests must include a title',
  NoBodyOrAttachments: 'Forum posts must include body or attachment',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only forum threads, questions, and requests supported',
  InsufficientTokenBalance: 'Users need to hold some of the community\'s tokens to post',
  CouldNotFetchTokenBalance: 'Unable to fetch user\'s token balance',
};

const createThread = async (
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

  const { topic_name, title, body, kind, stage, url, readOnly } = req.body;
  let { topic_id } = req.body;

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
  if (topic_id) {
    threadContent['topic_id'] = +topic_id;
  } else if (topic_name) {
    let offchainTopic;
    try {
      [offchainTopic] = await models.OffchainTopic.findOrCreate({
        where: {
          name: topic_name,
          community_id: community?.id || null,
          chain_id: chain?.id || null,
        },
      });
      threadContent['topic_id'] = offchainTopic.id;
      topic_id = offchainTopic.id;
    } catch (err) {
      return next(err);
    }
  } else {
    if ((community || chain).topics?.length) {
      return next(Error('Must pass a topic_name string and/or a numeric topic_id'));
    }
  }

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
        const threshold = (await models.OffchainTopic.findOne({ where: { id: topic_id } })).token_threshold;
        const tokenBalance = await tokenBalanceCache.getBalance(chain.id, req.body.address);

        if (threshold && tokenBalance.lt(threshold)) return next(new Error(Errors.InsufficientTokenBalance));
      } catch (e) {
        log.error(`hasToken failed: ${e.message}`);
        return next(new Error(Errors.CouldNotFetchTokenBalance));
      }
    }
  }

  let thread;
  try {
    thread = await models.OffchainThread.create(threadContent);
  } catch (err) {
    return next(new Error(err));
  }

  // TODO: attachments can likely be handled like topics & mentions (see lines 11-14)
  try {
    if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
      await models.OffchainAttachment.create({
        attachable: 'thread',
        attachment_id: thread.id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(req.body['attachments[]'].map((u) => models.OffchainAttachment.create({
        attachable: 'thread',
        attachment_id: thread.id,
        url: u,
        description: 'image',
      })));
    }
  } catch (err) {
    return next(err);
  }

  let finalThread;
  try {
    finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [
        { model: models.Address, as: 'Address' },
        models.OffchainAttachment,
        { model: models.OffchainTopic, as: 'topic' }
      ],
    });
  } catch (err) {
    return next(err);
  }

  // auto-subscribe thread creator to comments & reactions
  try {
    await models.Subscription.create({
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewComment,
      object_id: `discussion_${finalThread.id}`,
      offchain_thread_id: finalThread.id,
      community_id: finalThread.community || null,
      chain_id: finalThread.chain || null,
      is_active: true,
    });
    await models.Subscription.create({
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewReaction,
      object_id: `discussion_${finalThread.id}`,
      offchain_thread_id: finalThread.id,
      community_id: finalThread.community || null,
      chain_id: finalThread.chain || null,
      is_active: true,
    });
  } catch (err) {
    return next(new Error(err));
  }
  // auto-subscribe NewThread subscribers to NewComment as well
  // findOrCreate because redundant creation if author is also subscribed to NewThreads
  const location = finalThread.community || finalThread.chain;
  const subscribers = await models.Subscription.findAll({
    where: {
      category_id: NotificationCategories.NewThread,
      object_id: location,
    }
  });
  await Promise.all(subscribers.map((s) => {
    return models.Subscription.findOrCreate({
      where: {
        subscriber_id: s.subscriber_id,
        category_id: NotificationCategories.NewComment,
        object_id: `discussion_${finalThread.id}`,
        offchain_thread_id: finalThread.id,
        community_id: finalThread.community || null,
        chain_id: finalThread.chain || null,
        is_active: true,
      },
    });
  }));

  // grab mentions to notify tagged users
  const bodyText = decodeURIComponent(body);
  let mentionedAddresses;
  try {
    const mentions = parseUserMentions(bodyText);
    if (mentions?.length > 0) {
      mentionedAddresses = await Promise.all(mentions.map(async (mention) => {
        try {
          return models.Address.findOne({
            where: {
              chain: mention[0],
              address: mention[1],
            },
            include: [ models.User, models.Role ]
          });
        } catch (err) {
          return next(new Error(err));
        }
      }));
      // filter null results
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }
  } catch (e) {
    return next(new Error('Failed to parse mentions'));
  }

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(finalThread.Address.address);

  // dispatch notifications to subscribers of the given chain/community
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewThread,
    location,
    {
      created_at: new Date(),
      root_id: +finalThread.id,
      root_type: ProposalType.OffchainThread,
      root_title: finalThread.title,
      comment_text: finalThread.body,
      chain_id: finalThread.chain,
      community_id: finalThread.community,
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
      community: finalThread.community,
      body: finalThread.body,
    },
    req.wss,
    excludedAddrs,
  );

  // notify mentioned users, given permissions are in place
  if (mentionedAddresses?.length > 0) await Promise.all(mentionedAddresses.map(async (mentionedAddress) => {
    if (!mentionedAddress.User) return; // some Addresses may be missing users, e.g. if the user removed the address

    let shouldNotifyMentionedUser = true;
    if (finalThread.community) {
      const originCommunity = await models.OffchainCommunity.findOne({
        where: { id: finalThread.community }
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
        root_id: finalThread.id,
        root_type: ProposalType.OffchainThread,
        root_title: finalThread.title,
        comment_text: finalThread.body,
        chain_id: finalThread.chain,
        community_id: finalThread.community,
        author_address: finalThread.Address.address,
        author_chain: finalThread.Address.chain,
      },
      {
        user: finalThread.Address.address,
        url: getProposalUrl('discussion', finalThread),
        title: req.body.title,
        bodyUrl: req.body.url,
        chain: finalThread.chain,
        community: finalThread.community,
        body: finalThread.body,
      },
      req.wss,
      [ finalThread.Address.address ],
    );
  }));

  // update author.last_active (no await)
  author.last_active = new Date();
  author.save();

  // initialize view count (no await)
  models.OffchainViewCount.create({
    community: finalThread.community,
    chain: finalThread.chain,
    object_id: finalThread.id,
    view_count: 0,
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default createThread;
