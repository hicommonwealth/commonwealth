import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import moment from 'moment';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { NotificationCategories } from '../../shared/types';
import { getProposalUrl, getProposalUrlWithoutObject, renderQuillDeltaToText } from '../../shared/utils';
import { factory, formatFilename } from '../../shared/logging';
import { parseUserMentions } from '../util/parseUserMentions';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoId: 'Must provide id',
  NotAddrOwner: 'Address not owned by this user',
  NoProposal: 'No matching proposal found',
};

const editComment = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  if (!req.body.id) {
    return next(new Error(Errors.NoId));
  }

  const attachFiles = async () => {
    if (req.body['attachments[]'] && typeof req.body['attachments[]'] === 'string') {
      await models.OffchainAttachment.create({
        attachable: 'comment',
        attachment_id: req.body.id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(req.body['attachments[]'].map((u) => models.OffchainAttachment.create({
        attachable: 'comment',
        attachment_id: req.body.id,
        url: u,
        description: 'image',
      })));
    }
  };

  try {
    const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    const comment = await models.OffchainComment.findOne({
      where: {
        id: req.body.id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });
    let latestVersion;
    try {
      latestVersion = JSON.parse(comment.version_history[0]).body;
    } catch (e) {
      console.log(e);
    }
    // If new comment body text has been submitted, create another version history entry
    if (decodeURIComponent(req.body.body) !== latestVersion) {
      const recentEdit = {
        timestamp: moment(),
        body: decodeURIComponent(req.body.body)
      };
      const arr = comment.version_history;
      arr.unshift(JSON.stringify(recentEdit));
      comment.version_history = arr;
    }
    comment.text = req.body.body;
    comment.plaintext = (() => {
      try {
        return renderQuillDeltaToText(JSON.parse(decodeURIComponent(req.body.body)));
      } catch (e) {
        return decodeURIComponent(req.body.body);
      }
    })();
    await comment.save();
    await attachFiles();
    const finalComment = await models.OffchainComment.findOne({
      where: { id: comment.id },
      include: [models.Address, models.OffchainAttachment],
    });
    // get thread for crafting commonwealth url
    let proposal;
    const [prefix, id] = comment.root_id.split('_');
    if (prefix === 'discussion') {
      proposal = await models.OffchainThread.findOne({
        where: { id }
      });
    } else if (prefix.includes('proposal') || prefix.includes('referendum') || prefix.includes('motion')) {
      // TODO: better check for on-chain proposal types
      proposal = id;
    } else {
      log.error(`No matching proposal of thread for root_id ${comment.root_id}`);
    }
    if (!proposal) {
      throw new Error(Errors.NoProposal);
    }

    const cwUrl = typeof proposal === 'string'
      ? getProposalUrlWithoutObject(prefix, (comment.chain || comment.community), proposal, finalComment)
      : getProposalUrl(prefix, proposal, comment);
    const root_title = typeof proposal === 'string' ? '' : (proposal.title || '');

    // dispatch notifications to subscribers of the comment/thread
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.CommentEdit,
      '',
      {
        created_at: new Date(),
        root_id: comment.root_id,
        root_title,
        root_type: prefix,
        comment_id: +finalComment.id,
        comment_text: finalComment.text,
        chain_id: finalComment.chain,
        community_id: finalComment.community,
        author_address: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
      },
      // don't send webhook notifications for edits
      {
        user: finalComment.Address.address,
        url: cwUrl,
        title: proposal.title || '',
        chain: finalComment.chain,
        community: finalComment.community,
      },
      req.wss,
      [ finalComment.Address.address ],
    );

    let mentions;
    try {
      const previousDraftMentions = parseUserMentions(latestVersion);
      const currentDraftMentions = parseUserMentions(decodeURIComponent(req.body.body));
      mentions = currentDraftMentions.filter((addrArray) => {
        let alreadyExists = false;
        previousDraftMentions.forEach((addrArray_) => {
          if (addrArray[0] === addrArray_[0] && addrArray[1] === addrArray_[1]) {
            alreadyExists = true;
          }
        });
        return !alreadyExists;
      });
    } catch (e) {
      return next(new Error('Failed to parse mentions'));
    }

    // grab mentions to notify tagged users
    let mentionedAddresses;
    if (mentions?.length > 0) {
      mentionedAddresses = await Promise.all(mentions.map(async (mention) => {
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
          },
          req.wss,
          [ finalComment.Address.address ],
        );
      }));
    }

    // update author.last_active (no await)
    author.last_active = new Date();
    author.save();

    return res.json({ status: 'Success', result: finalComment.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editComment;
