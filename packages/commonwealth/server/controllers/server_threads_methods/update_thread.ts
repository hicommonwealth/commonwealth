import { AppError, ServerError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommentAttributes,
  CommunityInstance,
  DB,
  ThreadAttributes,
  ThreadInstance,
  UserInstance,
} from '@hicommonwealth/model';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import _ from 'lodash';
import {
  Op,
  QueryTypes,
  Sequelize,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { renderQuillDeltaToText, validURL } from '../../../shared/utils';
import {
  emitMentions,
  findMentionDiff,
  parseUserMentions,
} from '../../util/parseUserMentions';
import { findAllRoles } from '../../util/roles';
import { addVersionHistory } from '../../util/versioning';
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
  ContestLock: 'Cannot edit thread that is in a contest',
};

export type UpdateThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  threadId?: number;
  title?: string;
  body: string;
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
  canvasMsgId?: string;
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
    canvasMsgId,
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

  // check if thread is part of a contest topic
  const contestManagers = await this.models.sequelize.query(
    `
    SELECT cm.contest_address FROM "Threads" t
    JOIN "ContestTopics" ct on ct.topic_id = t.topic_id
    JOIN "ContestManagers" cm on cm.contest_address = ct.contest_address
    WHERE t.id = :thread_id
  `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        thread_id: thread!.id,
      },
    },
  );
  const isContestThread = contestManagers.length > 0;

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
    // @ts-expect-error StrictNullChecks
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

  const { latestVersion, versionHistory } = addVersionHistory(
    // @ts-expect-error StrictNullChecks
    thread.version_history,
    body,
    address,
  );

  // build analytics
  const allAnalyticsOptions: TrackOptions[] = [];

  const community = await this.models.Community.findByPk(thread.community_id);

  const previousDraftMentions = parseUserMentions(latestVersion);
  const currentDraftMentions = parseUserMentions(decodeURIComponent(body));

  const mentions = findMentionDiff(previousDraftMentions, currentDraftMentions);

  //  patch thread properties
  const transaction = await this.models.sequelize.transaction();

  try {
    const toUpdate: Partial<ThreadAttributes> = {};

    await setThreadAttributes(
      // @ts-expect-error StrictNullChecks
      permissions,
      thread,
      {
        title,
        body,
        url,
        canvasMsgId,
        canvasSignedData,
      },
      isContestThread,
      toUpdate,
    );

    // @ts-expect-error StrictNullChecks
    await setThreadPinned(permissions, pinned, toUpdate);

    // @ts-expect-error StrictNullChecks
    await setThreadSpam(permissions, spam, toUpdate);

    // @ts-expect-error StrictNullChecks
    await setThreadLocked(permissions, locked, toUpdate);

    // @ts-expect-error StrictNullChecks
    await setThreadArchived(permissions, archived, toUpdate);

    await setThreadStage(
      // @ts-expect-error StrictNullChecks
      permissions,
      stage,
      community,
      allAnalyticsOptions,
      toUpdate,
    );

    await setThreadTopic(
      // @ts-expect-error StrictNullChecks
      permissions,
      community,
      topicId,
      this.models,
      isContestThread,
      toUpdate,
    );

    await thread.update(
      {
        ...toUpdate,
        last_edited: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      { transaction },
    );

    if (versionHistory && body) {
      // The update above doesn't work because it can't detect array changes so doesn't write it to db
      await this.models.Thread.update(
        {
          version_history: versionHistory,
        },
        {
          where: { id: threadId },
          transaction,
        },
      );

      await this.models.ThreadVersionHistory.create(
        {
          thread_id: threadId!,
          address: address.address,
          body,
          timestamp: new Date(),
        },
        {
          transaction,
        },
      );
    }

    await updateThreadCollaborators(
      // @ts-expect-error StrictNullChecks
      permissions,
      thread,
      collaborators,
      isContestThread,
      this.models,
      transaction,
    );

    await emitMentions(this.models, transaction, {
      // @ts-expect-error StrictNullChecks
      authorAddressId: address.id,
      // @ts-expect-error StrictNullChecks
      authorUserId: user.id,
      authorAddress: address.address,
      mentions: mentions,
      thread,
    });

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
            attributes: ['id', 'profile'],
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
            attributes: ['id', 'profile'],
          },
        ],
      },
      { model: this.models.Topic, as: 'topic' },
      {
        model: this.models.Reaction,
        as: 'reactions',
        include: [
          {
            model: this.models.Address,
            as: 'Address',
            required: true,
            include: [
              {
                model: this.models.User,
                as: 'User',
                required: true,
                attributes: ['id', 'profile'],
              },
            ],
          },
        ],
      },
      {
        model: this.models.Comment,
        limit: 3, // This could me made configurable, atm we are using 3 recent comments with threads in frontend.
        order: [['created_at', 'DESC']],
        attributes: [
          'id',
          'address_id',
          'text',
          ['plaintext', 'plainText'],
          'created_at',
          'updated_at',
          'deleted_at',
          'marked_as_spam_at',
          'discord_meta',
        ],
        include: [
          {
            model: this.models.Address,
            attributes: ['address'],
            include: [
              {
                model: this.models.User,
                attributes: ['profile'],
              },
            ],
          },
        ],
      },
    ],
  });

  const now = new Date();
  // build notifications
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.ThreadEdit,
      data: {
        created_at: now,
        // @ts-expect-error StrictNullChecks
        thread_id: +finalThread.id,
        root_type: ProposalType.Thread,
        // @ts-expect-error StrictNullChecks
        root_title: finalThread.title,
        // @ts-expect-error StrictNullChecks
        community_id: finalThread.community_id,
        // @ts-expect-error StrictNullChecks
        author_address: finalThread.Address.address,
        // @ts-expect-error StrictNullChecks
        author_community_id: finalThread.Address.community_id,
      },
    },
    excludeAddresses: [address.address],
  });

  const updatedThreadWithComments = {
    // @ts-expect-error StrictNullChecks
    ...finalThread.toJSON(),
  } as ThreadAttributes & {
    Comments?: CommentAttributes[];
    recentComments?: CommentAttributes[];
  };
  updatedThreadWithComments.recentComments = (
    updatedThreadWithComments.Comments || []
  ).map((c) => {
    const temp = {
      ...c,
      address: c?.Address?.address || '',
    };

    if (temp.Address) delete temp.Address;

    return temp;
  });

  delete updatedThreadWithComments.Comments;

  return [
    updatedThreadWithComments,
    allNotificationOptions,
    allAnalyticsOptions,
  ];
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
  canvasMsgId?: string;
};

/**
 * Updates basic properties of the thread
 */
async function setThreadAttributes(
  permissions: UpdateThreadPermissions,
  thread: ThreadInstance,
  {
    title,
    body,
    url,
    canvasSignedData,
    canvasMsgId,
  }: UpdatableThreadAttributes,
  isContestThread: boolean,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (
    typeof title !== 'undefined' ||
    typeof body !== 'undefined' ||
    typeof url !== 'undefined'
  ) {
    if (isContestThread) {
      throw new AppError(Errors.ContestLock);
    }
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
    toUpdate.canvas_msg_id = canvasMsgId;
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
        // @ts-expect-error StrictNullChecks
        customStages = Array.from(communityStages)
          .map((s) => s.toString())
          .filter((s) => s);
      }
      if (customStages.length === 0) {
        customStages = [
          // @ts-expect-error StrictNullChecks
          'discussion',
          // @ts-expect-error StrictNullChecks
          'proposal_in_review',
          // @ts-expect-error StrictNullChecks
          'voting',
          // @ts-expect-error StrictNullChecks
          'passed',
          // @ts-expect-error StrictNullChecks
          'failed',
        ];
      }
    } catch (e) {
      throw new AppError(Errors.FailedToParse);
    }

    // validate stage
    // @ts-expect-error StrictNullChecks
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
  isContestThread: boolean,
  toUpdate: Partial<ThreadAttributes>,
) {
  if (typeof topicId !== 'undefined') {
    if (isContestThread) {
      throw new AppError(Errors.ContestLock);
    }
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
  isContestThread: boolean,
  models: DB,
  transaction: Transaction,
) {
  const { toAdd, toRemove } = collaborators || {};
  if (Array.isArray(toAdd) || Array.isArray(toRemove)) {
    if (isContestThread) {
      throw new AppError(Errors.ContestLock);
    }

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
            // @ts-expect-error StrictNullChecks
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
        // @ts-expect-error StrictNullChecks
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
