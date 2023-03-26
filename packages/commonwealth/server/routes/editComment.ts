import { AppError, ServerError } from 'common-common/src/errors';
import { NotificationCategories, ProposalType } from 'common-common/src/types';
import type { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { Op } from 'sequelize';
import {
  getThreadUrl,
  getThreadUrlWithoutObject,
  renderQuillDeltaToText,
} from '../../shared/utils';
import type { DB } from '../models';
import type BanCache from '../util/banCheckCache';
import emitNotifications from '../util/emitNotifications';
import { parseUserMentions } from '../util/parseUserMentions';

export const Errors = {
  NoId: 'Must provide id',
  NotAddrOwner: 'Address not owned by this user',
  NoProposal: 'No matching proposal found',
};

const editComment = async (
  models: DB,
  banCache: BanCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  if (!req.body.id) {
    return next(new AppError(Errors.NoId));
  }

  const author = req.address;

  // check if banned
  const [canInteract, banError] = await banCache.checkBan({
    chain: chain.id,
    address: author.address,
  });
  if (!canInteract) {
    return next(new AppError(banError));
  }

  const attachFiles = async () => {
    if (
      req.body['attachments[]'] &&
      typeof req.body['attachments[]'] === 'string'
    ) {
      await models.Attachment.create({
        attachable: 'comment',
        attachment_id: req.body.id,
        url: req.body['attachments[]'],
        description: 'image',
      });
    } else if (req.body['attachments[]']) {
      await Promise.all(
        req.body['attachments[]'].map((u) =>
          models.Attachment.create({
            attachable: 'comment',
            attachment_id: req.body.id,
            url: u,
            description: 'image',
          })
        )
      );
    }
  };

  try {
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const comment = await models.Comment.findOne({
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
        body: decodeURIComponent(req.body.body),
      };
      const arr = comment.version_history;
      arr.unshift(JSON.stringify(recentEdit));
      comment.version_history = arr;
    }
    comment.text = req.body.body;
    comment.plaintext = (() => {
      try {
        return renderQuillDeltaToText(
          JSON.parse(decodeURIComponent(req.body.body))
        );
      } catch (e) {
        return decodeURIComponent(req.body.body);
      }
    })();
    await comment.save();
    await attachFiles();
    const finalComment = await models.Comment.findOne({
      where: { id: comment.id },
      include: [models.Address, models.Attachment],
    });

    // get thread for crafting commonwealth url
    const proposal = await models.Thread.findOne({
      where: { id: comment.thread_id },
    });

    const cwUrl =
      typeof proposal === 'string'
        ? getThreadUrlWithoutObject(comment.chain, proposal, finalComment)
        : getThreadUrl(proposal, comment);
    const root_title = typeof proposal === 'string' ? '' : proposal.title || '';

    // dispatch notifications to subscribers of the comment/thread
    emitNotifications(
      models,
      NotificationCategories.CommentEdit,
      '',
      {
        created_at: new Date(),
        thread_id: comment.thread_id,
        root_title,
        root_type: ProposalType.Thread,
        comment_id: +finalComment.id,
        comment_text: finalComment.text,
        chain_id: finalComment.chain,
        author_address: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
      },
      // don't send webhook notifications for edits
      {
        user: finalComment.Address.address,
        url: cwUrl,
        title: proposal.title || '',
        chain: finalComment.chain,
      },
      [finalComment.Address.address]
    );

    let mentions;
    try {
      const previousDraftMentions = parseUserMentions(latestVersion);
      const currentDraftMentions = parseUserMentions(
        decodeURIComponent(req.body.body)
      );
      mentions = currentDraftMentions.filter((addrArray) => {
        let alreadyExists = false;
        previousDraftMentions.forEach((addrArray_) => {
          if (
            addrArray[0] === addrArray_[0] &&
            addrArray[1] === addrArray_[1]
          ) {
            alreadyExists = true;
          }
        });
        return !alreadyExists;
      });
    } catch (e) {
      return next(new AppError('Failed to parse mentions'));
    }

    // grab mentions to notify tagged users
    let mentionedAddresses;
    if (mentions?.length > 0) {
      mentionedAddresses = await Promise.all(
        mentions.map(async (mention) => {
          try {
            const user = await models.Address.findOne({
              where: {
                chain: mention[0],
                address: mention[1],
              },
              include: [models.User, models.RoleAssignment],
            });
            return user;
          } catch (err) {
            return next(new ServerError(err));
          }
        })
      );
      // filter null results
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }

    // notify mentioned users, given permissions are in place
    if (mentionedAddresses?.length > 0) {
      mentionedAddresses.map((mentionedAddress) => {
        if (!mentionedAddress.User) return; // some Addresses may be missing users, e.g. if the user removed the address
        emitNotifications(
          models,
          NotificationCategories.NewMention,
          `user-${mentionedAddress.User.id}`,
          {
            created_at: new Date(),
            thread_id: +comment.thread_id,
            root_title,
            root_type: ProposalType.Thread,
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
          },
          [finalComment.Address.address]
        );
      });
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
