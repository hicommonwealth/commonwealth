import moment from 'moment';
import { UserInstance } from '../../models/user';
import { ServerThreadsController } from '../server_threads_controller';
import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { Op, Sequelize, Transaction } from 'sequelize';
import { renderQuillDeltaToText, validURL } from '../../../shared/utils';
import { EmitOptions } from '../server_notifications_methods/emit';
import {
  NotificationCategories,
  ProposalType,
} from '../../../../common-common/src/types';
import { parseUserMentions } from '../../util/parseUserMentions';
import { ThreadAttributes, ThreadInstance } from '../../models/thread';
import { AppError } from '../../../../common-common/src/errors';
import { validateOwner } from '../../util/validateOwner';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  NoTitle: 'Must provide title',
  NoBody: 'Must provide body',
  InvalidLink: 'Invalid thread URL',
  ParseMentionsFailed: 'Failed to parse mentions',
  Unauthorized: 'Unauthorized',
  InvalidStage: 'Please Select a Stage',
  FailedToParse: 'Failed to parse custom stages',
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
  locked?: boolean;
  pinned?: boolean;
  canvas_action?: any;
  canvas_session?: any;
  canvas_hash?: any;
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
    locked,
    pinned,
    canvas_action,
    canvas_session,
    canvas_hash,
  }: UpdateThreadOptions
): Promise<UpdateThreadResult> {
  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    chain: chain.id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`Ban error: ${banError}`);
  }

  const thread = await this.models.Thread.findByPk(threadId);
  if (!thread) {
    throw new AppError(`${Errors.ThreadNotFound}: ${threadId}`);
  }

  // check if owner or admin
  const isOwnerOrAdmin = await validateOwner({
    models: this.models,
    user: user,
    entity: thread,
    chainId: chain.id,
    allowAdmin: true,
  });
  if (!isOwnerOrAdmin) {
    // check if collaborator
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
    if (!collaboration) {
      throw new AppError(Errors.Unauthorized);
    }
  }

  const now = new Date();

  // update version history
  let latestVersion;
  try {
    latestVersion = JSON.parse(thread.version_history[0]).body;
  } catch (e) {
    console.log(e);
  }
  if (decodeURIComponent(body) !== latestVersion) {
    const recentEdit: any = {
      timestamp: moment(now),
      author: address.address,
      body: decodeURIComponent(body),
    };
    const versionHistory: string = JSON.stringify(recentEdit);
    const arr = thread.version_history;
    arr.unshift(versionHistory);
    thread.version_history = arr;
  }

  // --- patch thread properties

  const transaction = await this.models.sequelize.transaction();

  try {
    await setThreadAttributes(
      thread,
      {
        title,
        body,
        url,
        pinned,
      },
      transaction
    );

    await setThreadStage(thread, chain, stage, transaction);

    await setThreadLocked(thread, locked, transaction);

    await setCanvasSession(
      thread,
      canvas_session,
      canvas_action,
      canvas_hash,
      transaction
    );

    await transaction.commit();
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    throw new AppError('transaction failed');
  }

  // ---

  thread.last_edited = now;

  await thread.save();

  const finalThread = await this.models.Thread.findOne({
    where: { id: thread.id },
    include: [
      { model: this.models.Address, as: 'Address' },
      {
        model: this.models.Address,
        // through: models.Collaboration,
        as: 'collaborators',
      },
      { model: this.models.Topic, as: 'topic' },
    ],
  });

  // build notifications
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    categoryId: NotificationCategories.ThreadEdit,
    objectId: '',
    notificationData: {
      created_at: now,
      thread_id: +finalThread.id,
      root_type: ProposalType.Thread,
      root_title: finalThread.title,
      chain_id: finalThread.chain,
      author_address: finalThread.Address.address,
      author_chain: finalThread.Address.chain,
    },
    // don't send webhook notifications for edits
    webhookData: null,
    excludeAddresses: [address.address],
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
    throw new AppError(Errors.ParseMentionsFailed);
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
          created_at: now,
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
  address.last_active = now;
  address.save();

  return [finalThread.toJSON(), allNotificationOptions];
}

/**
 * Updates basic properties of the thread
 */
async function setThreadAttributes(
  thread: ThreadInstance,
  {
    title,
    body,
    url,
    pinned,
  }: Partial<Pick<ThreadAttributes, 'title' | 'body' | 'url' | 'pinned'>>,
  transaction: Transaction
) {
  const toUpdate: Partial<ThreadAttributes> = {};

  // title
  if (typeof title !== 'undefined') {
    if (!title) {
      throw new AppError(Errors.NoTitle);
    }
    toUpdate.title = title;
  }

  // body
  if (typeof body !== 'undefined') {
    if (thread.kind === 'discussion' && (!body || !body.trim())) {
      throw new AppError(Errors.NoBody);
    }
    toUpdate.body = body;
    toUpdate.plaintext = (() => {
      try {
        return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
      } catch (e) {
        return decodeURIComponent(body);
      }
    })();
  }

  // url
  if (typeof url !== 'undefined' && thread.kind === 'link') {
    if (validURL(url)) {
      toUpdate.url = url;
    } else {
      throw new AppError(Errors.InvalidLink);
    }
  }

  if (typeof pinned !== 'undefined') {
    toUpdate.pinned = pinned;
  }

  if (Object.keys(toUpdate).length > 0) {
    await thread.update(toUpdate, { transaction });
  }
}

/**
 * Locks and unlocks the thread
 */
async function setThreadLocked(
  thread: ThreadInstance,
  locked: boolean | undefined,
  transaction: Transaction
) {
  if (typeof locked !== 'undefined') {
    const toUpdate: Partial<ThreadAttributes> = {};

    toUpdate.read_only = locked;
    toUpdate.locked_at = locked
      ? (Sequelize.literal('CURRENT_TIMESTAMP') as any)
      : null;

    await thread.update(toUpdate, { transaction });
  }
}

/**
 * Marks and umarks the thread as spam
 */
async function setThreadSpam(
  thread: ThreadInstance,
  spam: boolean | undefined,
  transaction: Transaction
) {
  if (typeof spam !== 'undefined') {
    const toUpdate: Partial<ThreadAttributes> = {};

    toUpdate.marked_as_spam_at = spam
      ? (Sequelize.literal('CURRENT_TIMESTAMP') as any)
      : null;

    await thread.update(toUpdate, { transaction });
  }
}

/**
 * Updates the stage of the thread
 */
async function setThreadStage(
  thread: ThreadInstance,
  chain: ChainInstance,
  stage: string | undefined,
  transaction: Transaction
) {
  if (typeof stage !== 'undefined') {
    const toUpdate: Partial<ThreadAttributes> = {};

    // fetch available stages
    let customStages = [];
    try {
      customStages = Array.from(JSON.parse(chain.custom_stages))
        .map((s) => s.toString())
        .filter((s) => s);
      if (customStages.length === 0) {
        customStages = [
          'discussion',
          'proposal_in_review',
          'voting',
          'passed',
          'failed',
        ];
      }
    } catch (e) {
      throw new AppError(Errors.FailedToParse);
    }

    // validate stage
    if (!customStages.includes(stage)) {
      throw new AppError(Errors.InvalidStage);
    }

    toUpdate.stage = stage;

    await thread.update(toUpdate, { transaction });
  }
}

/**
 * Updates the topic for the thread
 */
async function setThreadTopic(
  thread: ThreadInstance,
  topicId: string | undefined,
  topicName: string | undefined
) {
  const toUpdate: Partial<ThreadAttributes> = {};

  if (topicId) {
    thread.topic_id = topicId;
    await thread.save();
    newTopic = await models.Topic.findOne({
      where: { id: topicId },
    });
  } else {
    [newTopic] = await models.Topic.findOrCreate({
      where: {
        name: req.body.topic_name,
        chain_id: thread.chain,
      },
    });
    thread.topic_id = newTopic.id;
    await thread.save();
  }

  if (Object.keys(toUpdate).length > 0) {
    await thread.update(toUpdate, { transaction });
  }
}

/**
 * Adds collaborators for the thread
 */
async function addThreadEditors(thread: ThreadInstance, editors: string[]) {}

/**
 * Removes collaborators for the thread
 */
async function removeThreadEditors(thread: ThreadInstance, editors: string[]) {}

/**
 * Updates the canvas session for the thread
 */
async function setCanvasSession(
  thread: ThreadInstance,
  canvas_session: string | undefined,
  canvas_action: string | undefined,
  canvas_hash: string | undefined,
  transaction: Transaction
) {
  if (typeof canvas_session !== 'undefined') {
    const toUpdate: Partial<ThreadAttributes> = {};
    toUpdate.canvas_session = canvas_session;
    toUpdate.canvas_action = canvas_action;
    toUpdate.canvas_hash = canvas_hash;
    await thread.update(toUpdate, { transaction });
  }
}
