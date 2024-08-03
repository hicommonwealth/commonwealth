import { PermissionEnum } from '@hicommonwealth/schemas';
import moment from 'moment';

import { Actor, AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommunityInstance,
  Contest,
  ThreadAttributes,
  UserInstance,
  config,
  sanitizeQuillText,
  tokenBalanceCache,
} from '@hicommonwealth/model';
import {
  BalanceSourceType,
  NotificationCategories,
  ProposalType,
} from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { renderQuillDeltaToText } from '../../../shared/utils';
import {
  emitMentions,
  parseUserMentions,
  uniqueMentions,
} from '../../util/parseUserMentions';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_controller';
import { EmitOptions } from '../server_notifications_methods/emit';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  ParseMentionsFailed: 'Failed to parse mentions',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only discussion and link posts supported',
  FailedCreateThread: 'Failed to create thread',
  DiscussionMissingTitle: 'Discussion posts must include a title',
  NoBody: 'Thread body cannot be blank',
  PostLimitReached: 'Post limit reached',
};

export type CreateThreadOptions = {
  user: UserInstance;
  address: AddressInstance;
  community: CommunityInstance;
  title: string;
  body: string;
  kind: string;
  readOnly: boolean;
  topicId?: number;
  stage?: string;
  url?: string;
  canvasSignedData?: string;
  canvasMsgId?: string;
  discordMeta?: any;
};

export type CreateThreadResult = [
  ThreadAttributes,
  EmitOptions[],
  TrackOptions,
];

export async function __createThread(
  this: ServerThreadsController,
  {
    user,
    address,
    community,
    title,
    body,
    kind,
    readOnly,
    topicId,
    stage,
    url,
    canvasSignedData,
    canvasMsgId,
    discordMeta,
  }: CreateThreadOptions,
): Promise<CreateThreadResult> {
  // sanitize text
  body = sanitizeQuillText(body);

  if (kind === 'discussion') {
    if (!title || !title.trim()) {
      throw new AppError(Errors.DiscussionMissingTitle);
    }
    try {
      const quillDoc = JSON.parse(decodeURIComponent(body));
      if (quillDoc.ops.length === 1 && quillDoc.ops[0].insert.trim() === '') {
        throw new AppError(Errors.NoBody);
      }
    } catch (e) {
      // check always passes if the body isn't a Quill document
    }
  } else if (kind === 'link') {
    if (!title?.trim() || !url?.trim()) {
      throw new AppError(Errors.LinkMissingTitleOrUrl);
    }
  } else {
    throw new AppError(Errors.UnsupportedKind);
  }

  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: community.id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`Ban error: ${banError}`);
  }

  // check contest limits
  const activeContestManagers = await Contest.GetActiveContestManagers().body({
    actor: {} as Actor,
    payload: {
      community_id: community.id!,
      topic_id: topicId!,
    },
  });
  if (activeContestManagers && activeContestManagers.length > 0) {
    // ensure that user has non-dust ETH value
    const balances = await tokenBalanceCache.getBalances({
      balanceSourceType: BalanceSourceType.ETHNative,
      addresses: [address.address],
      sourceOptions: {
        evmChainId: activeContestManagers[0]!.eth_chain_id,
      },
      cacheRefresh: true,
    });
    const minUserEthBigNumber = BigNumber.from(
      (config.CONTESTS.MIN_USER_ETH * 1e18).toFixed(),
    );
    if (BigNumber.from(balances[address.address]).lt(minUserEthBigNumber)) {
      throw new AppError(
        `user ETH balance insufficient (${
          balances[address.address]
        } of ${minUserEthBigNumber})`,
      );
    }

    // ensure post limit not reached on all contests
    const validActiveContests = activeContestManagers.filter((c) => {
      const userPostsInContest = c.actions.filter(
        (action) =>
          action.actor_address === address.address && action.action === 'added',
      );
      const quotaReached =
        userPostsInContest.length >= config.CONTESTS.MAX_USER_POSTS_PER_CONTEST;
      return !quotaReached;
    });
    if (validActiveContests.length === 0) {
      // limit reached for all active contests
      throw new AppError(Errors.PostLimitReached);
    }
  }

  // Render a copy of the thread to plaintext for the search indexer
  const plaintext = (() => {
    try {
      return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
    } catch (e) {
      return decodeURIComponent(body);
    }
  })();

  // New threads get an empty version history initialized, which is passed
  // the thread's first version, formatted on the frontend with timestamps
  const firstVersion: any = {
    timestamp: moment(),
    author: address,
    body: decodeURIComponent(body),
  };
  const version_history: string[] = [JSON.stringify(firstVersion)];

  const threadContent: Partial<ThreadAttributes> = {
    community_id: community.id,
    address_id: address.id,
    title,
    body,
    plaintext,
    version_history,
    kind,
    stage,
    url,
    read_only: readOnly,
    canvas_signed_data: canvasSignedData,
    canvas_msg_id: canvasMsgId,
    discord_meta: discordMeta,
    // @ts-expect-error StrictNullChecks
    topic_id: +topicId,
  };

  const isAdmin = await validateOwner({
    models: this.models,
    user,
    // @ts-expect-error StrictNullChecks
    communityId: community.id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    const { isValid, message } = await validateTopicGroupsMembership(
      this.models,
      // @ts-expect-error StrictNullChecks
      topicId,
      community.id,
      address,
      PermissionEnum.CREATE_THREAD,
    );
    if (!isValid) {
      throw new AppError(`${Errors.FailedCreateThread}: ${message}`);
    }
  }

  const bodyText = decodeURIComponent(body);
  const mentions = uniqueMentions(parseUserMentions(bodyText));

  // begin essential database changes within transaction
  const newThreadId = await this.models.sequelize.transaction(
    async (transaction) => {
      // @ts-expect-error StrictNullChecks
      const thread = await this.models.Thread.create(threadContent, {
        transaction,
      });

      await this.models.ThreadVersionHistory.create(
        {
          thread_id: thread.id!,
          body,
          address: address.address!,
          timestamp: thread.created_at!,
        },
        {
          transaction,
        },
      );

      address.last_active = new Date();
      await address.save({ transaction });

      await emitMentions(this.models, transaction, {
        // @ts-expect-error StrictNullChecks
        authorAddressId: address.id,
        // @ts-expect-error StrictNullChecks
        authorUserId: user.id,
        authorAddress: address.address,
        mentions: mentions,
        thread,
      });

      return thread.id;
      // end of transaction
    },
  );

  const finalThread = await this.models.Thread.findOne({
    where: { id: newThreadId },
    include: [
      { model: this.models.Address, as: 'Address' },
      { model: this.models.Topic, as: 'topic' },
    ],
  });

  // exit early on error, do not emit notifications
  if (!finalThread) {
    throw new AppError(Errors.FailedCreateThread);
  }

  // -----

  // auto-subscribe thread creator to comments & reactions
  await this.models.Subscription.bulkCreate([
    {
      // @ts-expect-error StrictNullChecks
      subscriber_id: user.id,
      category_id: NotificationCategories.NewComment,
      // @ts-expect-error StrictNullChecks
      thread_id: finalThread.id,
      community_id: finalThread.community_id,
      is_active: true,
    },
    {
      // @ts-expect-error StrictNullChecks
      subscriber_id: user.id,
      category_id: NotificationCategories.NewReaction,
      // @ts-expect-error StrictNullChecks
      thread_id: finalThread.id,
      community_id: finalThread.community_id,
      is_active: true,
    },
  ]);

  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.NewThread,
      data: {
        created_at: new Date(),
        // @ts-expect-error StrictNullChecks
        thread_id: finalThread.id,
        root_type: ProposalType.Thread,
        root_title: finalThread.title,
        // @ts-expect-error StrictNullChecks
        comment_text: finalThread.body,
        community_id: finalThread.community_id,
        // @ts-expect-error StrictNullChecks
        author_address: finalThread.Address.address,
        // @ts-expect-error StrictNullChecks
        author_community_id: finalThread.Address.community_id,
      },
    },
    // @ts-expect-error StrictNullChecks
    excludeAddresses: [finalThread.Address.address],
  });

  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
    community: community.id,
    userId: user.id,
  };

  return [finalThread.toJSON(), allNotificationOptions, analyticsOptions];
}
