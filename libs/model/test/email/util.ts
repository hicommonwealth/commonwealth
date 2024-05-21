import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  EnrichedChainProposalsNotification,
  EnrichedCommentCreatedNotification,
  EnrichedCommunityStakeNotification,
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
  Profile,
  Thread,
  User,
} from '@hicommonwealth/schemas';
import { z } from 'zod';

type ArrayItemType<T> = T extends Array<infer U> ? U : never;

export function generateDiscussionData(
  authorUser: z.infer<typeof User>,
  authorProfile: z.infer<typeof Profile>,
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
  const userMentionedNotification: z.infer<typeof UserMentionedNotification> = {
    author: authorProfile.profile_name!,
    author_address: authorAddress.address,
    author_address_id: authorAddress.id!,
    author_profile_id: authorProfile.id,
    author_user_id: authorUser.id!,
    community_id: community.id!,
    community_name: community.name,
    object_body: 'Testing',
    object_url: `/${community.id}/discussion/${thread.id}?comment=${comment.id}`,
  };

  const commentCreatedNotification: z.infer<typeof CommentCreatedNotification> =
    {
      author: authorProfile.profile_name!,
      comment_parent_name: comment.parent_id ? 'comment' : 'thread',
      community_name: community.name,
      comment_body: 'Testing',
      comment_url: `/${community.id}/discussion/${thread.id}?comment=${comment.id}`,
      comment_created_event: comment,
    };

  const enrichedUserMentionedNotification: z.infer<
    typeof EnrichedUserMentionedNotification
  > = {
    ...userMentionedNotification,
    author_avatar_url: authorProfile.avatar_url!,
  };

  const enrichedCommentCreatedNotification: z.infer<
    typeof EnrichedCommentCreatedNotification
  > = {
    ...commentCreatedNotification,
    author_avatar_url: authorProfile.avatar_url!,
  };

  const date = new Date();

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
    community_icon_url: community.icon_url,
  };

  const enrichedChainProposalsNotification: z.infer<
    typeof EnrichedChainProposalsNotification
  > = {
    ...chainProposalsNotification,
    community_icon_url: community.icon_url,
  };

  const date = new Date();

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
      community_icon_url: community.icon_url,
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
