import { AppError, ServerError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommunityInstance,
  DB,
  ThreadAttributes,
  ThreadInstance,
  UserInstance,
} from '@hicommonwealth/model';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import _ from 'lodash';
import moment from 'moment';
import { Op, Sequelize, Transaction, WhereOptions } from 'sequelize';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { renderQuillDeltaToText, validURL } from '../../../shared/utils';
import { parseUserMentions } from '../../util/parseUserMentions';
import { findAllRoles } from '../../util/roles';
import { TrackOptions } from '../server_analytics_controller';
import { EmitOptions } from '../server_notifications_methods/emit';
import { ServerThreadsController } from '../server_threads_controller';

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
  InvalidTopic: 'Invalid topic',
  MissingCollaborators: 'Failed to find all provided collaborators',
  CollaboratorsOverlap:
    'Cannot overlap addresses when adding/removing collaborators',
};

export type UpdateThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  threadId?: number;
  title?: string;
  body?: string;
  stage?: string;
  url?: string;
  locked?: boolean;
  pinned?: boolean;
  archived?: boolean;
  spam?: boolean;
  topicId?: number;
  collaborators?: {
    toAdd?: number[];
    toRemove?: number[];
  };
  canvasSignedData?: string;
  canvasHash?: string;
  discordMeta?: any;
};

export type UpdateThreadResult = [
  ThreadAttributes,
  EmitOptions[],
  TrackOptions[],
];

export async function __updateThread(
  this: ServerThreadsController,
  {
    user,
    address,
    threadId,
    title,
    body,
    stage,
    url,
    locked,
    pinned,
    archived,
    spam,
    topicId,
    collaborators,
    canvasHash,
    canvasSignedData,
    discordMeta,
  }: UpdateThreadOptions,
): Promise<UpdateThreadResult> {
  // Discobot handling

  const threadWhere: WhereOptions<ThreadAttributes> = {};
  if (threadId) {
    threadWhere.id = threadId;
  }
  if (discordMeta) {
    threadWhere.discord_meta = discordMeta;
  }

  const thread = await this.models.Thread.findOne({
    where: threadWhere,
    include: {
      model: this.models.Address,
      as: 'collaborators',
      required: false,
    },
  });

  if (!thread) {
    throw new AppError(Errors.ThreadNotFound);
  }

  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: thread.community_id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`Ban error: ${banError}`);
  }

  // get various permissions
  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const roles = await findAllRoles(
    this.models,
    { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
    thread.community_id,
    ['moderator', 'admin'],
  );

  const isCollaborator = !!thread.collaborators?.find(
    (a) => a.address === address.address,
  );
  const isThreadOwner = userOwnedAddressIds.includes(thread.address_id);
  const isMod = !!roles.find(
    (r) =>
      r.community_id === thread.community_id && r.permission === 'moderator',
  );
  const isAdmin = !!roles.find(
    (r) => r.community_id === thread.community_id && r.permission === 'admin',
  );
  const isSuperAdmin = user.isAdmin;
  if (
    !isThreadOwner &&
    !isMod &&
    !isAdmin &&
    !isSuperAdmin &&
    !isCollaborator
  ) {
    throw new AppError(Errors.Unauthorized);
  }
  const permissions = {
    isThreadOwner,
    isMod,
    isAdmin,
    isSuperAdmin,
    isCollaborator,
  };

  const now = new Date();

  // update version history
  let latestVersion;
  try {
    latestVersion = JSON.parse(thread.version_history[0]).body;
  } catch (err) {
    console.log(err);
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

  // build analytics
  const allAnalyticsOptions: TrackOptions[] = [];

  const community = await this.models.Community.findByPk(thread.community_id);

  //  patch thread properties
  const transaction = await this.models.sequelize.transaction();

  try {
    const toUpdate: Partial<ThreadAttributes> = {};

    await setThreadAttributes(
      permissions,
      thread,
      {
        title,
        body,
        url,
        canvasHash,
        canvasSignedData,
      },
      toUpdate,
    );

    await setThreadPinned(permissions, pinned, toUpdate);

    await setThreadSpam(permissions, spam, toUpdate);

    await setThreadLocked(permissions, locked, toUpdate);

    await setThreadArchived(permissions, archived, toUpdate);

    await setThreadStage(
      permissions,
      stage,
      community,
      allAnalyticsOptions,
      toUpdate,
    );

    await setThreadTopic(
      permissions,
      community,
      topicId,
      this.models,
      toUpdate,
    );

    await thread.update(
      {
        ...toUpdate,
        last_edited: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      { transaction },
    );

    await updateThreadCollaborators(
      permissions,
      thread,
      collaborators,
      this.models,
      transaction,
    );

    await transaction.commit();
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    if (err instanceof AppError || err instanceof ServerError) {
      throw err;
    }
    throw new ServerError(`transaction failed: ${err.message}`);
  }

  // ---

  address
    .update({
      last_active: Sequelize.literal('CURRENT_TIMESTAMP'),
    })
    .catch(console.error);

  const finalThread = await this.models.Thread.findOne({
    where: { id: thread.id },
    include: [
      {
        model: this.models.Address,
        as: 'Address',
        include: [
          {
            model: this.models.User,
            as: 'User',
            required: true,
            attributes: ['id'],
            include: [
              {
                model: this.models.Profile,
                as: 'Profiles',
                required: true,
                attributes: ['id', 'avatar_url', 'profile_name'],
              },
            ],
          },
        ],
      },
      {
        model: this.models.Address,
        as: 'collaborators',
        include: [
          {
            model: this.models.User,
            as: 'User',
            required: true,
            attributes: ['id'],
            include: [
              {
                model: this.models.Profile,
                as: 'Profiles',
                required: true,
                attributes: ['id', 'avatar_url', 'profile_name'],
              },
            ],
          },
        ],
      },
      { model: this.models.Topic, as: 'topic' },
    ],
  });

  // build notifications
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.ThreadEdit,
      data: {
        created_at: now,
        thread_id: +finalThread.id,
        root_type: ProposalType.Thread,
        root_title: finalThread.title,
        community_id: finalThread.community_id,
        author_address: finalThread.Address.address,
        author_community_id: finalThread.Address.community_id,
      },
    },
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
              community_id: mention[0],
              address: mention[1],
            },
            include: [this.models.User],
          });
          return mentionedUser;
        } catch (err) {
          return null;
        }
      }),
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
        notification: {
          categoryId: NotificationCategories.NewMention,
          data: {
            mentioned_user_id: mentionedAddress.User.id,
            created_at: now,
            thread_id: +finalThread.id,
            root_type: ProposalType.Thread,
            root_title: finalThread.title,
            comment_text: finalThread.body,
            community_id: finalThread.community_id,
            author_address: finalThread.Address.address,
            author_community_id: finalThread.Address.community_id,
          },
        },
        excludeAddresses: [finalThread.Address.address],
      });
    });
  }

  return [finalThread.toJSON(), allNotificationOptions, allAnalyticsOptions];
}

// -----

export type UpdateThreadPermissions = {
  isThreadOwner: boolean;
  isMod: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCollaborator: boolean;
};

/**
 * Throws error if none of the permission flags are satisfied
 * (no error is thrown if at least one flag is satisfied)
 */
export function validatePermissions(
  permissions: UpdateThreadPermissions,
  flags: Partial<UpdateThreadPermissions>,
) {
  const keys = [
    'isThreadOwner',
    'isMod',
    'isAdmin',
    'isSuperAdmin',
    'isCollaborator',
  ];
  for (const k of keys) {
    if (flags[k] && permissions[k]) {
      // at least one flag is satisfied
      return;
    }
  }
  // no flags were satisfied
  throw new AppError(Errors.Unauthorized);
}

export type UpdatableThreadAttributes = {
  title?: string;
  body?: string;
  url?: string;
  canvasSignedData?: string;
  canvasHash?: string;
};

/**
 * Updates basic properties of the thread
 */
async function setThreadAttributes(
  permissions: UpdateThreadPermissions,
  thread: ThreadInstance,
  { title, body, url, canvasSignedData, canvasHash }: UpdatableThreadAttributes,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (
    typeof title !== 'undefined' ||
    typeof body !== 'undefined' ||
    typeof url !== 'undefined'
  ) {
    validatePermissions(permissions, {
      isThreadOwner: true,
      isMod: true,
      isAdmin: true,
      isSuperAdmin: true,
      isCollaborator: true,
    });

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
      if (!validURL(url)) {
        throw new AppError(Errors.InvalidLink);
      }
      toUpdate.url = url;
    }

    toUpdate.canvas_signed_data = canvasSignedData;
    toUpdate.canvas_hash = canvasHash;
  }
}

/**
 * Pins and unpins the thread
 */
async function setThreadPinned(
  permissions: UpdateThreadPermissions,
  pinned: boolean | undefined,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (typeof pinned !== 'undefined') {
    validatePermissions(permissions, {
      isMod: true,
      isAdmin: true,
      isSuperAdmin: true,
    });

    toUpdate.pinned = pinned;
  }
}

/**
 * Locks and unlocks the thread
 */
async function setThreadLocked(
  permissions: UpdateThreadPermissions,
  locked: boolean | undefined,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (typeof locked !== 'undefined') {
    validatePermissions(permissions, {
      isThreadOwner: true,
      isMod: true,
      isAdmin: true,
      isSuperAdmin: true,
    });

    toUpdate.read_only = locked;
    toUpdate.locked_at = locked
      ? (Sequelize.literal('CURRENT_TIMESTAMP') as any)
      : null;
  }
}

/**
 * Archives and unarchives a thread
 */
async function setThreadArchived(
  permissions: UpdateThreadPermissions,
  archive: boolean | undefined,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (typeof archive !== 'undefined') {
    validatePermissions(permissions, {
      isThreadOwner: true,
      isMod: true,
      isAdmin: true,
      isSuperAdmin: true,
    });

    toUpdate.archived_at = archive
      ? (Sequelize.literal('CURRENT_TIMESTAMP') as any)
      : null;
  }
}

/**
 * Marks and umarks the thread as spam
 */
async function setThreadSpam(
  permissions: UpdateThreadPermissions,
  spam: boolean | undefined,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (typeof spam !== 'undefined') {
    validatePermissions(permissions, {
      isMod: true,
      isAdmin: true,
      isSuperAdmin: true,
    });

    toUpdate.marked_as_spam_at = spam
      ? (Sequelize.literal('CURRENT_TIMESTAMP') as any)
      : null;
  }
}

/**
 * Updates the stage of the thread
 */
async function setThreadStage(
  permissions: UpdateThreadPermissions,
  stage: string | undefined,
  community: CommunityInstance,
  allAnalyticsOptions: TrackOptions[],
  toUpdate: Partial<ThreadAttributes>,
) {
  if (typeof stage !== 'undefined') {
    validatePermissions(permissions, {
      isThreadOwner: true,
      isMod: true,
      isAdmin: true,
      isSuperAdmin: true,
    });

    // fetch available stages
    let customStages = [];
    try {
      const communityStages = community.custom_stages;
      if (Array.isArray(communityStages)) {
        customStages = Array.from(communityStages)
          .map((s) => s.toString())
          .filter((s) => s);
      }
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

    allAnalyticsOptions.push({
      event: MixpanelCommunityInteractionEvent.UPDATE_STAGE,
    });
  }
}

/**
 * Updates the topic for the thread
 */
async function setThreadTopic(
  permissions: UpdateThreadPermissions,
  community: CommunityInstance,
  topicId: number,
  models: DB,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (typeof topicId !== 'undefined') {
    validatePermissions(permissions, {
      isThreadOwner: true,
      isMod: true,
      isAdmin: true,
      isSuperAdmin: true,
    });
    const topic = await models.Topic.findOne({
      where: {
        id: topicId,
        community_id: community.id,
      },
    });

    if (!topic) {
      throw new AppError(Errors.InvalidTopic);
    }
    toUpdate.topic_id = topic.id;
  }
}

/**
 * Updates the collaborators of a thread
 */
async function updateThreadCollaborators(
  permissions: UpdateThreadPermissions,
  thread: ThreadInstance,
  collaborators:
    | {
        toAdd?: number[];
        toRemove?: number[];
      }
    | undefined,
  models: DB,
  transaction: Transaction,
) {
  const { toAdd, toRemove } = collaborators || {};
  if (Array.isArray(toAdd) || Array.isArray(toRemove)) {
    validatePermissions(permissions, {
      isThreadOwner: true,
      isSuperAdmin: true,
    });

    const toAddUnique = _.uniq(toAdd || []);
    const toRemoveUnique = _.uniq(toRemove || []);

    // check for overlap between toAdd and toRemove
    for (const r of toRemoveUnique) {
      if (toAddUnique.includes(r)) {
        throw new AppError(Errors.CollaboratorsOverlap);
      }
    }

    // add collaborators
    if (toAddUnique.length > 0) {
      const collaboratorAddresses = await models.Address.findAll({
        where: {
          community_id: thread.community_id,
          id: {
            [Op.in]: toAddUnique,
          },
        },
      });
      if (collaboratorAddresses.length !== toAddUnique.length) {
        throw new AppError(Errors.MissingCollaborators);
      }
      await Promise.all(
        collaboratorAddresses.map(async (address) => {
          return models.Collaboration.findOrCreate({
            where: {
              thread_id: thread.id,
              address_id: address.id,
            },
            transaction,
          });
        }),
      );
    }

    // remove collaborators
    if (toRemoveUnique.length > 0) {
      await models.Collaboration.destroy({
        where: {
          thread_id: thread.id,
          address_id: {
            [Op.in]: toRemoveUnique,
          },
        },
        transaction,
      });
    }
  }
}
