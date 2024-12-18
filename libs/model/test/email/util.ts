import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  EnrichedChainProposalsNotification,
  EnrichedCommentCreatedNotification,
  EnrichedCommunityStakeNotification,
  EnrichedNotificationNames,
  EnrichedSnapshotProposalCreatedNotification,
  EnrichedUserMentionedNotification,
  KnockChannelIds,
  NotificationsProviderGetMessagesReturn,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  Address,
  Comment,
  Community,
  Thread,
  User,
} from '@hicommonwealth/schemas';
import { z } from 'zod';
import { seed } from '../../src/tester';

type ArrayItemType<T> = T extends Array<infer U> ? U : never;

export function generateDiscussionData(
  authorUser: z.infer<typeof User>,
  authorAddress: z.infer<typeof Address>,
  recipientUser: z.infer<typeof User>,
  community: z.infer<typeof Community>,
  thread: z.infer<typeof Thread>,
  comment: z.infer<typeof Comment>,
): {
  notifications: [
    z.infer<typeof UserMentionedNotification>,
    z.infer<typeof CommentCreatedNotification>,
  ];
  enrichedNotifications: [
    z.infer<typeof EnrichedUserMentionedNotification>,
    z.infer<typeof EnrichedCommentCreatedNotification>,
  ];
  messages: [
    ArrayItemType<NotificationsProviderGetMessagesReturn>,
    ArrayItemType<NotificationsProviderGetMessagesReturn>,
  ];
} {
  const date = new Date();

  const userMentionedNotification: z.infer<typeof UserMentionedNotification> = {
    author: authorUser.profile.name!,
    author_address: authorAddress.address,
    author_address_id: authorAddress.id!,
    author_user_id: authorUser.id!,
    community_id: community.id!,
    community_name: community.name,
    object_body: 'Testing',
    object_url: `/${community.id}/discussion/${thread.id}?comment=${comment.id}`,
  };

  const commentCreatedNotification: z.infer<typeof CommentCreatedNotification> =
    {
      author: authorUser.profile.name!,
      comment_parent_name: comment.parent_id ? 'comment' : 'thread',
      community_name: community.name,
      comment_body: 'Testing',
      comment_url: `/${community.id}/discussion/${thread.id}?comment=${comment.id}`,
      comment_created_event: { ...comment, community_id: community.id! },
    };

  const enrichedUserMentionedNotification: z.infer<
    typeof EnrichedUserMentionedNotification
  > = {
    ...userMentionedNotification,
    event_name: EnrichedNotificationNames.UserMentioned,
    author_avatar_url: authorUser.profile.avatar_url!,
    inserted_at: date.toISOString(),
  };

  const enrichedCommentCreatedNotification: z.infer<
    typeof EnrichedCommentCreatedNotification
  > = {
    ...commentCreatedNotification,
    event_name: EnrichedNotificationNames.CommentCreated,
    author_avatar_url: authorUser.profile.avatar_url!,
    inserted_at: date.toISOString(),
  };

  const userMentionedMessage: ArrayItemType<NotificationsProviderGetMessagesReturn> =
    {
      id: '1',
      channel_id: KnockChannelIds.InApp,
      recipient: String(recipientUser.id!),
      tenant: null,
      status: 'delivered',
      read_at: null,
      seen_at: null,
      archived_at: null,
      inserted_at: date.toISOString(),
      updated_at: date.toISOString(),
      source: {
        version_id: '1',
        key: WorkflowKeys.UserMentioned,
      },
      data: userMentionedNotification,
      __cursor: '1',
    };

  const commentCreatedMessage: ArrayItemType<NotificationsProviderGetMessagesReturn> =
    {
      id: '2',
      channel_id: KnockChannelIds.InApp,
      recipient: String(recipientUser.id!),
      tenant: null,
      status: 'delivered',
      read_at: null,
      seen_at: null,
      archived_at: null,
      inserted_at: date.toISOString(),
      updated_at: date.toISOString(),
      source: {
        version_id: '1',
        key: WorkflowKeys.CommentCreation,
      },
      data: commentCreatedNotification,
      __cursor: '2',
    };

  return {
    notifications: [userMentionedNotification, commentCreatedNotification],
    enrichedNotifications: [
      enrichedUserMentionedNotification,
      enrichedCommentCreatedNotification,
    ],
    messages: [userMentionedMessage, commentCreatedMessage],
  };
}

export function generateGovernanceData(
  snapshotProposal: {
    id: string;
    space: string;
  },
  recipientUser: z.infer<typeof User>,
  community: z.infer<typeof Community>,
): {
  notifications: [
    z.infer<typeof SnapshotProposalCreatedNotification>,
    z.infer<typeof ChainProposalsNotification>,
  ];
  enrichedNotifications: [
    z.infer<typeof EnrichedSnapshotProposalCreatedNotification>,
    z.infer<typeof EnrichedChainProposalsNotification>,
  ];
  messages: [
    ArrayItemType<NotificationsProviderGetMessagesReturn>,
    ArrayItemType<NotificationsProviderGetMessagesReturn>,
  ];
} {
  const date = new Date();

  const snapshotProposalCreatedNotification: z.infer<
    typeof SnapshotProposalCreatedNotification
  > = {
    community_id: community.id!,
    community_name: community.name,
    space_name: snapshotProposal.space,
    snapshot_proposal_url: `http://localhost/${community.id}/snapshot/${snapshotProposal.space}/${snapshotProposal.id}`,
  };

  const chainProposalsNotification: z.infer<typeof ChainProposalsNotification> =
    {
      community_id: community.id!,
      proposal_kind: 'proposal-created',
      community_name: community.name,
      proposal_url: 'https://testing.com',
    };

  const enrichedSnapshotProposalCreatedNotification: z.infer<
    typeof EnrichedSnapshotProposalCreatedNotification
  > = {
    ...snapshotProposalCreatedNotification,
    event_name: EnrichedNotificationNames.SnapshotProposalCreated,
    community_icon_url: community.icon_url,
    inserted_at: date.toISOString(),
  };

  const enrichedChainProposalsNotification: z.infer<
    typeof EnrichedChainProposalsNotification
  > = {
    ...chainProposalsNotification,
    event_name: EnrichedNotificationNames.ChainProposal,
    community_icon_url: community.icon_url,
    inserted_at: date.toISOString(),
  };

  const snapshotProposalCreatedMessage: ArrayItemType<NotificationsProviderGetMessagesReturn> =
    {
      id: '1',
      channel_id: KnockChannelIds.InApp,
      recipient: String(recipientUser.id!),
      tenant: null,
      status: 'delivered',
      read_at: null,
      seen_at: null,
      archived_at: null,
      inserted_at: date.toISOString(),
      updated_at: date.toISOString(),
      source: {
        version_id: '1',
        key: WorkflowKeys.SnapshotProposals,
      },
      data: snapshotProposalCreatedNotification,
      __cursor: '1',
    };

  const chainProposalsMessage: ArrayItemType<NotificationsProviderGetMessagesReturn> =
    {
      id: '2',
      channel_id: KnockChannelIds.InApp,
      recipient: String(recipientUser.id!),
      tenant: null,
      status: 'delivered',
      read_at: null,
      seen_at: null,
      archived_at: null,
      inserted_at: date.toISOString(),
      updated_at: date.toISOString(),
      source: {
        version_id: '1',
        key: WorkflowKeys.ChainProposals,
      },
      data: chainProposalsNotification,
      __cursor: '2',
    };

  return {
    notifications: [
      snapshotProposalCreatedNotification,
      chainProposalsNotification,
    ],
    enrichedNotifications: [
      enrichedSnapshotProposalCreatedNotification,
      enrichedChainProposalsNotification,
    ],
    messages: [snapshotProposalCreatedMessage, chainProposalsMessage],
  };
}

export function generateProtocolData(
  numNotifications: number,
  oldestDate: Date,
  recipientUser: z.infer<typeof User>,
  community: z.infer<typeof Community>,
): {
  notifications: z.infer<typeof CommunityStakeNotification>[];
  enrichedNotifications: z.infer<typeof EnrichedCommunityStakeNotification>[];
  messages: NotificationsProviderGetMessagesReturn;
} {
  const notifications: z.infer<typeof CommunityStakeNotification>[] = [];
  const enrichedNotifications: z.infer<
    typeof EnrichedCommunityStakeNotification
  >[] = [];
  const messages: NotificationsProviderGetMessagesReturn = [];

  const currentDate = new Date();
  const timeDiff = currentDate.getTime() - oldestDate.getTime();
  const timeStep = numNotifications > 1 ? timeDiff / (numNotifications - 1) : 0;

  for (let i = 0; i < numNotifications; i++) {
    const notificationDate = new Date(oldestDate.getTime() + timeStep * i);
    const notification: z.infer<typeof CommunityStakeNotification> = {
      community_id: community.id!,
      transaction_type: Math.random() < 0.5 ? 'minted' : 'burned',
      community_name: community.name,
      community_stakes_url: `http://localhost/${community.id}`,
    };

    enrichedNotifications.push({
      ...notification,
      event_name: EnrichedNotificationNames.CommunityStakeTrade,
      community_icon_url: community.icon_url,
      inserted_at: notificationDate.toISOString(),
    });
    notifications.push(notification);

    messages.push({
      id: String(i),
      channel_id: KnockChannelIds.InApp,
      recipient: String(recipientUser.id!),
      tenant: null,
      status: 'delivered',
      read_at: null,
      seen_at: null,
      archived_at: null,
      inserted_at: notificationDate.toISOString(),
      updated_at: notificationDate.toISOString(),
      source: {
        version_id: '1',
        key: WorkflowKeys.CommunityStake,
      },
      data: notification,
      __cursor: String(i),
    });
  }

  return {
    notifications,
    enrichedNotifications,
    messages,
  };
}

export async function generateThreads(
  communityOne: z.infer<typeof Community>,
  communityTwo: z.infer<typeof Community>,
  communityThree: z.infer<typeof Community>,
) {
  await seed('Thread', {
    address_id: communityThree?.Addresses?.at(0)?.id,
    community_id: communityThree?.id,
    topic_id: communityThree?.topics?.at(0)?.id,
    pinned: false,
    read_only: false,
    reaction_weights_sum: '0',
  });

  // 3 threads for communityOne and 1 thread for communityTwo
  const [threadOne] = await seed('Thread', {
    address_id: communityOne?.Addresses?.at(0)?.id,
    community_id: communityOne?.id,
    topic_id: communityOne?.topics?.at(0)?.id,
    pinned: false,
    read_only: false,
    view_count: 10,
    reaction_weights_sum: '0',
  });
  const [threadTwo] = await seed('Thread', {
    address_id: communityOne?.Addresses?.at(0)?.id,
    community_id: communityOne?.id,
    topic_id: communityOne?.topics?.at(0)?.id,
    pinned: false,
    read_only: false,
    view_count: 5,
    reaction_weights_sum: '0',
  });

  const [threadThree] = await seed('Thread', {
    address_id: communityOne?.Addresses?.at(0)?.id,
    community_id: communityOne?.id,
    topic_id: communityTwo?.topics?.at(0)?.id,
    pinned: false,
    read_only: false,
    view_count: 1,
    reaction_weights_sum: '0',
  });

  const [threadFour] = await seed('Thread', {
    address_id: communityTwo?.Addresses?.at(0)?.id,
    community_id: communityTwo?.id,
    topic_id: communityTwo?.topics?.at(0)?.id,
    pinned: false,
    read_only: false,
    view_count: 10,
    reaction_weights_sum: '0',
  });

  return {
    threadOne,
    threadTwo,
    threadThree,
    threadFour,
  };
}
