import moment from 'moment';
import { UserInstance } from '../../models/user';
import { ServerThreadsController } from '../server_threads_controller';
import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { findOneRole } from '../../util/roles';
import { Op } from 'sequelize';
import { renderQuillDeltaToText, validURL } from '../../../shared/utils';
import { EmitOptions } from '../server_notifications_methods/emit';
import {
  NotificationCategories,
  ProposalType,
} from '../../../../common-common/src/types';
import { parseUserMentions } from '../../util/parseUserMentions';
import { ThreadAttributes } from '../../models/thread';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  NoBodyOrAttachment: 'Must provide body or attachment',
  InvalidLink: 'Invalid thread URL',
  ParseMentionsFailed: 'Failed to parse mentions',
};

export type UpdateThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  threadId: number;
  title?: string;
  body?: string;
  stage?: string;
  url?: string;
  attachments?: any;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
};

export type UpdateThreadResult = [ThreadAttributes, EmitOptions[]];

export async function __updateThread(
  this: ServerThreadsController,
  {
    user,
    address,
    chain,
    threadId,
    title,
    body,
    stage,
    url,
    attachments,
    canvasAction,
    canvasSession,
    canvasHash,
  }: UpdateThreadOptions
): Promise<UpdateThreadResult> {
  const userOwnedAddresses = await user.getAddresses();
  const userOwnedAddressIds = userOwnedAddresses
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const collaboration = await this.models.Collaboration.findOne({
    where: {
      thread_id: threadId,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });

  const admin = await findOneRole(
    this.models,
    { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
    chain.id,
    ['admin']
  );

  // check if banned
  if (!admin) {
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: chain.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new Error(`${Errors.BanError}: ${banError}`);
    }
  }

  let thread;
  if (collaboration || admin) {
    thread = await this.models.Thread.findOne({
      where: {
        id: threadId,
      },
    });
  } else {
    thread = await this.models.Thread.findOne({
      where: {
        id: threadId,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });
  }
  if (!thread) {
    throw new Error(`${Errors.ThreadNotFound}: ${threadId}`);
  }

  // check attachments
  if (thread.kind === 'discussion') {
    if ((!body || !body.trim()) && (!attachments || attachments.length === 0)) {
      throw new Error(Errors.NoBodyOrAttachment);
    }
  }

  const attachFiles = async () => {
    if (attachments && typeof attachments === 'string') {
      await this.models.Attachment.create({
        attachable: 'thread',
        attachment_id: threadId,
        url: attachments,
        description: 'image',
      });
    } else if (attachments) {
      await Promise.all(
        attachments.map((url_) =>
          this.models.Attachment.create({
            attachable: 'thread',
            attachment_id: threadId,
            url: url_,
            description: 'image',
          })
        )
      );
    }
  };

  let latestVersion;
  try {
    latestVersion = JSON.parse(thread.version_history[0]).body;
  } catch (e) {
    console.log(e);
  }
  // If new comment body text has been submitted, create another version history entry
  if (decodeURIComponent(body) !== latestVersion) {
    const recentEdit: any = {
      timestamp: moment(),
      author: address.address,
      body: decodeURIComponent(body),
    };
    const versionHistory: string = JSON.stringify(recentEdit);
    const arr = thread.version_history;
    arr.unshift(versionHistory);
    thread.version_history = arr;
  }

  // patch thread properties
  if (title) {
    thread.title = title;
  }
  if (typeof body !== 'undefined') {
    thread.body = body;
    thread.plaintext = (() => {
      try {
        return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
      } catch (e) {
        return decodeURIComponent(body);
      }
    })();
  }
  if (typeof stage !== 'undefined') {
    thread.stage = stage;
  }
  if (typeof canvasSession !== 'undefined') {
    thread.canvas_session = canvasSession;
    thread.canvas_action = canvasAction;
    thread.canvas_hash = canvasHash;
  }
  if (typeof url !== 'undefined' && thread.kind === 'link') {
    if (validURL(url)) {
      thread.url = url;
    } else {
      throw new Error(Errors.InvalidLink);
    }
  }
  thread.last_edited = new Date().toISOString();

  await thread.save();
  await attachFiles();

  const finalThread = await this.models.Thread.findOne({
    where: { id: thread.id },
    include: [
      { model: this.models.Address, as: 'Address' },
      {
        model: this.models.Address,
        // through: models.Collaboration,
        as: 'collaborators',
      },
      this.models.Attachment,
      { model: this.models.Topic, as: 'topic' },
    ],
  });

  // build notifications
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    categoryId: NotificationCategories.ThreadEdit,
    objectId: '',
    notificationData: {
      created_at: new Date(),
      thread_id: +finalThread.id,
      root_type: ProposalType.Thread,
      root_title: finalThread.title,
      chain_id: finalThread.chain,
      author_address: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
    },
    // don't send webhook notifications for edits
    webhookData: null,
    excludeAddresses: [userOwnedAddresses[0].address],
  });

  let mentions;
  try {
    const previousDraftMentions = parseUserMentions(latestVersion);
    const currentDraftMentions = parseUserMentions(decodeURIComponent(body));
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
        try {
          const mentionedUser = await this.models.Address.findOne({
            where: {
              chain: mention[0],
              address: mention[1],
            },
            include: [this.models.User],
          });
          return mentionedUser;
        } catch (err) {
          return null;
        }
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
          thread_id: +finalThread.id,
          root_type: ProposalType.Thread,
          root_title: finalThread.title,
          comment_text: finalThread.body,
          chain_id: finalThread.chain,
          author_address: finalThread.Address.address,
          author_chain: finalThread.Address.chain,
        },
        webhookData: null,
        excludeAddresses: [finalThread.Address.address],
      });
    });
  }

  // update address last active
  address.last_active = new Date();
  address.save();

  return [finalThread.toJSON(), allNotificationOptions];
}
