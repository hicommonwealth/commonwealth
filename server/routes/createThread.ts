import { Request, Response, NextFunction } from 'express';
import { NotificationCategories, ProposalType } from '../../shared/types';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl } from '../../shared/utils';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  ForumMissingTitle: 'Forum posts must include a title',
  QuestionMissingTitle: 'Questions must include a title',
  RequestMissingTitle: 'Requests must include a title',
  NoBodyOrAttachments: 'Forum posts must include body or attachment',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only forum threads, questions, and requests supported',
};

const createThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);
  const { tag, title, body, kind, url, privacy, readOnly } = req.body;

  const mentions = typeof req.body['mentions[]'] === 'string'
    ? [req.body['mentions[]']]
    : typeof req.body['mentions[]'] === 'undefined'
      ? []
      : req.body['mentions[]'];

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
    private: privacy,
    read_only: readOnly,
  } : {
    chain: chain.id,
    author_id: author.id,
    title,
    body,
    version_history: versionHistory,
    kind,
    url,
    private: privacy || false,
    read_only: readOnly || false,
  };

  // New Tag table entries created
  if (typeof Number(tag) === 'number') {
    threadContent['tag_id'] = Number(tag);
  } else if (typeof tag === 'string') {
    let offchainTag;
    try {
      [offchainTag] = await models.OffchainTag.findOrCreate({
        where: {
          name: tag,
          community_id: community?.id || null,
          chain_id: chain?.id || null,
        },
      });
      console.log(offchainTag);
      console.log(typeof offchainTag.id)
      threadContent['tag_id'] = offchainTag.id;
    } catch (err) {
      log.error(err);
    }
  } else {
    return next(Error('Must pass either a numeric tag id or new tag name as string'));
  }

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

  let finalThread;
  try {
    finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [
        models.Address,
        models.OffchainAttachment,
        { model: models.OffchainTag, as: 'tag' }
      ],
    });
  } catch (err) {
    return next(err);
  }

  // auto-subscribe thread creator to replies & reactions
  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewComment,
    object_id: `discussion_${finalThread.id}`,
    is_active: true,
  });

  await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: NotificationCategories.NewReaction,
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
      root_id: Number(finalThread.id),
      root_type: ProposalType.OffchainThread,
      root_title: finalThread.title,
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
    },
    req.wss,
    [ finalThread.Address.address ],
  );

  // grab mentions to notify tagged users
  let mentionedAddresses;
  if (mentions?.length > 0) {
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
    // filter null results
    mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
  }

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
        root_id: Number(finalThread.id),
        root_type: ProposalType.OffchainThread,
        root_title: finalThread.title,
        chain_id: finalThread.chain,
        community_id: finalThread.community,
        author_address: finalThread.Address.address,
        author_chain: finalThread.Address.chain,
      },
      req.wss,
      [ finalThread.Address.address ],
    );
  }));

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default createThread;
