import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { getProposalUrl, renderQuillDeltaToText } from '../../shared/utils';
import { NotificationCategories, ProposalType } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoBodyOrAttachment: 'Must provide body or attachment',
  IncorrectOwner: 'Not owned by this user',
};

const editThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { body, title, kind, thread_id, version_history, } = req.body;

  if (!thread_id) {
    return next(new Error(Errors.NoThreadId));
  }

  if (kind === 'forum') {
    if ((!body || !body.trim()) && (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)) {
      return next(new Error(Errors.NoBodyOrAttachment));
    }
  }
  const attachFiles = async () => {
    if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
      await models.OffchainAttachment.create({
        attachable: 'thread',
        attachment_id: thread_id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(req.body['attachments[]'].map((url) => models.OffchainAttachment.create({
        attachable: 'thread',
        attachment_id: thread_id,
        url,
        description: 'image',
      })));
    }
  };

  try {
    const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });
    if (!thread) return next(new Error('No thread with that id found'));
    const arr = thread.version_history;
    arr.unshift(version_history);
    thread.version_history = arr;
    thread.body = body;
    thread.plaintext = (() => {
      try {
        return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
      } catch (e) {
        return decodeURIComponent(body);
      }
    })();
    if (title) {
      thread.title = title;
    }
    await thread.save();
    await attachFiles();
    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread.id },
      include: [ models.Address, models.OffchainAttachment, { model: models.OffchainTopic, as: 'topic' } ],
    });

    // dispatch notifications to subscribers of the given chain/community
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.ThreadEdit,
      '',
      {
        created_at: new Date(),
        root_id: Number(finalThread.id),
        root_type: ProposalType.OffchainThread,
        root_title: finalThread.title,
        chain_id: finalThread.chain,
        community_id: finalThread.community,
        author_address: finalThread.Address.address
      },
      // don't send webhook notifications for edits
      null,
      req.wss,
      [ finalThread.Address.address ],
    );

    const mentions = typeof req.body['mentions[]'] === 'string'
      ? [req.body['mentions[]']]
      : typeof req.body['mentions[]'] === 'undefined'
        ? []
        : req.body['mentions[]'];
    // grab mentions to notify tagged users
    let mentionedAddresses;
    if (mentions?.length > 0) {
      mentionedAddresses = await Promise.all(mentions.map(async (mention) => {
        mention = mention.split(',');
        try {
          const user = await models.Address.findOne({
            where: {
              chain: mention[0],
              address: mention[1],
            },
            include: [ models.User, models.Role ]
          });
          return user;
        } catch (err) {
          return next(new Error(err));
        }
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

    // TODO: update author.last_active

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default editThread;
