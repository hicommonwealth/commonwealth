import { Op } from 'sequelize';
import moment from 'moment';

import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { UserInstance } from '../../models/user';
import { getThreadUrl, renderQuillDeltaToText } from '../../../shared/utils';
import {
  NotificationCategories,
  ProposalType,
} from '../../../../common-common/src/types';
import { parseUserMentions } from '../../util/parseUserMentions';
import { CommentAttributes } from '../../models/comment';
import { ServerCommentsController } from '../server_comments_controller';
import { EmitOptions } from '../server_notifications_methods/emit';

const Errors = {
  ThreadNotFoundForComment: 'Thread not found for comment',
  BanError: 'Ban error',
  ParseMentionsFailed: 'Failed to parse mentions',
};

export type UpdateCommentOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  commentId: number;
  commentBody: string;
  attachments?: any;
};

export type UpdateCommentResult = [CommentAttributes, EmitOptions[]];

export async function __updateComment(
  this: ServerCommentsController,
  {
    user,
    address,
    chain,
    commentId,
    commentBody,
    attachments,
  }: UpdateCommentOptions
): Promise<UpdateCommentResult> {
  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    chain: chain.id,
    address: address.address,
  });
  if (!canInteract) {
    throw new Error(`${Errors.BanError}: ${banError}`);
  }

  const attachFiles = async () => {
    if (attachments && typeof attachments === 'string') {
      await this.models.Attachment.create({
        attachable: 'comment',
        attachment_id: commentId,
        url: attachments,
        description: 'image',
      });
    } else if (attachments) {
      await Promise.all(
        attachments.map((u) =>
          this.models.Attachment.create({
            attachable: 'comment',
            attachment_id: commentId,
            url: u,
            description: 'image',
          })
        )
      );
    }
  };

  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const comment = await this.models.Comment.findOne({
    where: {
      id: commentId,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });

  const thread = await this.models.Thread.findOne({
    where: { id: comment.thread_id },
  });
  if (!thread) {
    throw new Error(Errors.ThreadNotFoundForComment);
  }

  let latestVersion;
  try {
    latestVersion = JSON.parse(comment.version_history[0]).body;
  } catch (e) {
    console.log(e);
  }
  // If new comment body text has been submitted, create another version history entry
  if (decodeURIComponent(commentBody) !== latestVersion) {
    const recentEdit = {
      timestamp: moment(),
      body: decodeURIComponent(commentBody),
    };
    const arr = comment.version_history;
    arr.unshift(JSON.stringify(recentEdit));
    comment.version_history = arr;
  }
  comment.text = commentBody;
  comment.plaintext = (() => {
    try {
      return renderQuillDeltaToText(
        JSON.parse(decodeURIComponent(commentBody))
      );
    } catch (e) {
      return decodeURIComponent(commentBody);
    }
  })();
  await comment.save();
  await attachFiles();
  const finalComment = await this.models.Comment.findOne({
    where: { id: comment.id },
    include: [this.models.Address, this.models.Attachment],
  });

  const cwUrl = getThreadUrl(thread, comment?.id);
  const root_title = thread.title || '';

  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    categoryId: NotificationCategories.CommentEdit,
    objectId: '',
    notificationData: {
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
    webhookData: {
      user: finalComment.Address.address,
      url: cwUrl,
      title: thread.title || '',
      chain: finalComment.chain,
    },
    excludeAddresses: [finalComment.Address.address],
  });

  let mentions;
  try {
    const previousDraftMentions = parseUserMentions(latestVersion);
    const currentDraftMentions = parseUserMentions(
      decodeURIComponent(commentBody)
    );
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
    throw new Error(Errors.ParseMentionsFailed);
  }

  // grab mentions to notify tagged users
  let mentionedAddresses;
  if (mentions?.length > 0) {
    mentionedAddresses = await Promise.all(
      mentions.map(async (mention) => {
        const mentionedUser = await this.models.Address.findOne({
          where: {
            chain: mention[0],
            address: mention[1],
          },
          include: [this.models.User],
        });
        return mentionedUser;
      })
    );
    // filter null results
    mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
  }

  // notify mentioned users, given permissions are in place
  if (mentionedAddresses?.length > 0) {
    mentionedAddresses.forEach((mentionedAddress) => {
      if (!mentionedAddress.User) {
        return; // some Addresses may be missing users, e.g. if the user removed the address
      }
      allNotificationOptions.push({
        categoryId: NotificationCategories.NewMention,
        objectId: `user-${mentionedAddress.User.id}`,
        notificationData: {
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
        webhookData: null,
        excludeAddresses: [finalComment.Address.address],
      });
    });
  }

  // update address last active
  address.last_active = new Date();
  address.save();

  return [finalComment.toJSON(), allNotificationOptions];
}
