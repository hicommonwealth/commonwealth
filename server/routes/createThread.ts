import { NotificationCategories } from '../../shared/types';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { createCommonwealthUrl } from '../util/routeUtils';

const createThread = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  const { title, body, kind, url } = req.body;

  const mentions = typeof req.body['mentions[]'] === 'string'
    ? [req.body['mentions[]']]
    : typeof req.body['mentions[]'] === 'undefined'
      ? []
      : req.body['mentions[]'];
  const tags = typeof req.body['tags[]'] === 'string'
    ? [req.body['tags[]']]
    : typeof req.body['tags[]'] === 'undefined'
      ? []
      : req.body['tags[]'];

  if (kind === 'forum') {
    if (!title || !title.trim()) {
      return next(new Error('Forum posts must include a title'));
    }
    if (tags.length > 3) {
      return next(new Error('Forum posts are allowed three tags max.'));
    }
    if ((!body || !body.trim()) && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
      return next(new Error('Forum posts must include body or attachment'));
    }
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === ''
          && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
        return next(new Error('Forum posts must include body or attachment'));
      }
    } catch (e) {
      // check always passes if the body isn't a Quill document
    }
  } else if (kind === 'question') {
    if (!title || !title.trim()) {
      return next(new Error('Questions must include a title'));
    }
  } else if (kind === 'request') {
    if (!title || !title.trim()) {
      return next(new Error('Requests must include a title'));
    }
  } else if (kind === 'link') {
    if (!title || !title.trim() || !url) {
      return next(new Error('Requests must include a title and URL'));
    }
  } else {
    return next(new Error('Only forum threads, questions, and requests supported'));
  }

  // New threads get an empty version history initialized, which is passed
  // the thread's first version, formatted on the frontend with timestamps
  const versionHistory = [];
  versionHistory.push(req.body.versionHistory);

  const threadContent = community ? {
    community: community.id,
    author_id: author.id,
    title,
    body,
    version_history: versionHistory,
    kind,
    url,
  } : {
    chain: chain.id,
    author_id: author.id,
    title,
    body,
    version_history: versionHistory,
    kind,
    url,
  };

  const thread = await models.OffchainThread.create(threadContent);

  // To-do: attachments can likely be handled like tags & mentions (see lines 11-14)
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

  // New Tag table entries created
  await Promise.all(tags.map(async (tag) => {
    let offchainTag;
    try {
      [offchainTag] = await models.OffchainTag.findOrCreate({
        where: {
          name: tag,
          community_id: community?.id || null,
          chain_id: chain?.id || null,
        },
      });
    } catch (err) {
      console.log(err);
    }
    try {
      await models.TaggedThread.create({
        tag_id: offchainTag.id,
        thread_id: thread.id,
      });
    } catch (err) {
      console.log(err);
    }
  }));

  let finalThread;
  try {
    finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [
        models.Address,
        models.OffchainAttachment,
        {
          model: models.OffchainTag,
          as: 'tags',
          through: {
            model: models.TaggedThread,
          },
        }
      ],
    });
  } catch (err) {
    return next(err);
  }

  // auto-subscribe thread creator to replies
  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewComment,
    object_id: `discussion_${finalThread.id}`,
    is_active: true,
  });
  const location = finalThread.community || finalThread.chain;
  // dispatch notifications to subscribers of the given chain/community
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewThread,
    location,
    {
      created_at: new Date(),
      thread_title: finalThread.title,
      thread_id: finalThread.id,
      chain_id: finalThread.chain,
      community_id: finalThread.community,
      author_address: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
    },
    {
      user: finalThread.Address.address,
      url: createCommonwealthUrl(finalThread),
      title: req.body.title,
      bodyUrl: req.body.url,
      chain: finalThread.chain,
      community: finalThread.community,
    },
    req.wss,
  );

  // grab mentions to notify tagged users
  let mentionedAddresses;
  if (mentions?.length) {
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
      console.log(err);
    }
  }

  // notify mentioned users, given permissions are in place
  if (mentionedAddresses?.length) await Promise.all(mentionedAddresses.map(async (mentionedAddress) => {
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
        post_type: 'thread',
        thread_title: finalThread.title,
        thread_id: finalThread.id,
        chain_id: finalThread.chain,
        community_id: finalThread.community,
        author_address: finalThread.Address.address,
        author_chain: finalThread.Address.chain,
      },
      req.wss
    );
  }));

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default createThread;
