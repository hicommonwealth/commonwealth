import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  EnrichedNotificationNames,
  ExternalServiceUserIds,
  GetRecapEmailData,
  KnockChannelIds,
  Query,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
  WorkflowKeys,
  logger,
  notificationsProvider,
} from '@hicommonwealth/core';
import { SubscriptionPreference } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { config, models } from '..';

const log = logger(import.meta);
type AdditionalMetaData<Key extends keyof typeof EnrichedNotificationNames> = {
  event_name: (typeof EnrichedNotificationNames)[Key];
  inserted_at: string;
};

type DiscussionNotifications = Array<
  | (z.infer<typeof CommentCreatedNotification> &
      AdditionalMetaData<'CommentCreated'>)
  | (z.infer<typeof UserMentionedNotification> &
      AdditionalMetaData<'UserMentioned'>)
>;
type GovernanceNotifications = Array<
  | (z.infer<typeof ChainProposalsNotification> &
      AdditionalMetaData<'ChainProposal'>)
  | (z.infer<typeof SnapshotProposalCreatedNotification> &
      AdditionalMetaData<'SnapshotProposalCreated'>)
>;
type ProtocolNotifications = Array<
  z.infer<typeof CommunityStakeNotification> &
    AdditionalMetaData<'CommunityStakeTrade'>
>;

async function getMessages(userId: string): Promise<{
  discussion: DiscussionNotifications;
  governance: GovernanceNotifications;
  protocol: ProtocolNotifications;
}> {
  const discussion: DiscussionNotifications = [];
  const governance: GovernanceNotifications = [];
  const protocol: ProtocolNotifications = [];

  const sevenDaysAgo = new Date(new Date().getTime() - 604_800_000);
  let oldestFetched = new Date();
  let cursor: string | undefined;
  const provider = notificationsProvider();
  while (
    oldestFetched > sevenDaysAgo &&
    (discussion.length < 10 || governance.length < 10 || protocol.length < 10)
  ) {
    const messages = await provider.getMessages({
      user_id: userId,
      page_size: 50,
      channel_id: KnockChannelIds.InApp,
      cursor,
    });

    if (!messages.length) {
      break;
    }

    cursor = messages[messages.length - 1].__cursor;
    oldestFetched = new Date(messages[messages.length - 1].inserted_at);

    for (const message of messages) {
      if (new Date(message.inserted_at) < sevenDaysAgo) {
        break;
      }

      switch (message.source.key) {
        case WorkflowKeys.CommentCreation:
          discussion.push({
            event_name: EnrichedNotificationNames.CommentCreated,
            ...message.data,
            inserted_at: message.inserted_at,
          });
          break;
        case WorkflowKeys.UserMentioned:
          discussion.push({
            event_name: EnrichedNotificationNames.UserMentioned,
            ...message.data,
            inserted_at: message.inserted_at,
          });
          break;
        case WorkflowKeys.ChainProposals:
          governance.push({
            event_name: EnrichedNotificationNames.ChainProposal,
            ...message.data,
            inserted_at: message.inserted_at,
          });
          break;
        case WorkflowKeys.SnapshotProposals:
          governance.push({
            event_name: EnrichedNotificationNames.SnapshotProposalCreated,
            ...message.data,
            inserted_at: message.inserted_at,
          });
          break;
        case WorkflowKeys.CommunityStake:
          protocol.push({
            event_name: EnrichedNotificationNames.CommunityStakeTrade,
            ...message.data,
            inserted_at: message.inserted_at,
          });
          break;
      }
    }
  }

  return { discussion, governance, protocol };
}

async function enrichDiscussionNotifications(
  discussion: DiscussionNotifications,
): Promise<z.infer<(typeof GetRecapEmailData)['output']>['discussion']> {
  if (!discussion.length) return [];

  const enrichedDiscussion: z.infer<
    (typeof GetRecapEmailData)['output']
  >['discussion'] = [];

  const unfilteredIds: number[] = [];
  for (const n of discussion) {
    if ('comment_created_event' in n && n.comment_created_event.address_id) {
      unfilteredIds.push(n.comment_created_event.address_id);
    } else if ('author_address_id' in n && n.author_address_id) {
      unfilteredIds.push(n.author_address_id);
    }
  }

  if (!unfilteredIds.length) {
    log.error('Address ids not found!', undefined, {
      discussion,
    });
    return [];
  }

  const discussionAvatars = await models.sequelize.query<{
    user_avatars: { [user_id: string]: string };
  }>(
    `
        SELECT JSONB_OBJECT_AGG(A.id, U.profile ->> 'avatar_url') as user_avatars
        FROM "Addresses" A
                 JOIN "Users" U ON A.user_id = U.id
        WHERE A.id IN (:addressIds);
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        addressIds: Array.from(new Set(unfilteredIds)),
      },
    },
  );

  for (const notif of discussion) {
    enrichedDiscussion.push({
      ...notif,
      author_avatar_url:
        'comment_created_event' in notif
          ? discussionAvatars[0]?.user_avatars[
              notif.comment_created_event.address_id
            ]
          : discussionAvatars[0]?.user_avatars[notif.author_address_id],
    });
  }

  return enrichedDiscussion;
}

async function enrichGovAndProtocolNotif({
  governance,
  protocol,
}: {
  governance: GovernanceNotifications;
  protocol: ProtocolNotifications;
}): Promise<{
  governance: z.infer<(typeof GetRecapEmailData)['output']>['governance'];
  protocol: z.infer<(typeof GetRecapEmailData)['output']>['protocol'];
}> {
  if (!governance.length && !protocol.length)
    return { governance: [], protocol: [] };

  const enrichedGovernance: z.infer<
    (typeof GetRecapEmailData)['output']
  >['governance'] = [];
  const enrichedProtocol: z.infer<
    (typeof GetRecapEmailData)['output']
  >['protocol'] = [];

  const unfilteredCommunityIds: string[] = [];

  for (const n of [...governance, ...protocol]) {
    unfilteredCommunityIds.push(n.community_id);
  }

  if (!unfilteredCommunityIds.length) {
    log.error('Community ids not found!', undefined, {
      governance,
      protocol,
    });
    return {
      governance: [],
      protocol: [],
    };
  }

  const communityIcons = await models.sequelize.query<{
    icon_urls: { [community_id: string]: string };
  }>(
    `
        SELECT JSONB_OBJECT_AGG(C.id, C.icon_url) as icon_urls
        FROM "Communities" C
        WHERE id IN (:communityIds);
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        communityIds: Array.from(new Set(unfilteredCommunityIds)),
      },
    },
  );

  for (const notif of governance) {
    enrichedGovernance.push({
      ...notif,
      community_icon_url: communityIcons[0]?.icon_urls[notif.community_id],
    });
  }

  for (const notif of protocol) {
    enrichedProtocol.push({
      ...notif,
      community_icon_url: communityIcons[0]?.icon_urls[notif.community_id],
    });
  }

  return {
    governance: enrichedGovernance,
    protocol: enrichedProtocol,
  };
}

export function GetRecapEmailDataQuery(): Query<typeof GetRecapEmailData> {
  return {
    ...GetRecapEmailData,
    auth: [],
    secure: true,
    authStrategy: { name: 'authtoken', userId: ExternalServiceUserIds.Knock },
    body: async ({ payload }) => {
      const existingPreferences: z.infer<typeof SubscriptionPreference> | null =
        await models.SubscriptionPreference.findOne({
          where: {
            user_id: payload.user_id,
          },
          raw: true,
        });

      const notifications = await getMessages(payload.user_id);
      const enrichedGovernanceAndProtocol = await enrichGovAndProtocolNotif({
        governance: notifications.governance,
        protocol: notifications.protocol,
      });
      const enrichedDiscussion = await enrichDiscussionNotifications(
        notifications.discussion,
      );
      return {
        discussion: enrichedDiscussion,
        ...enrichedGovernanceAndProtocol,
        num_notifications:
          enrichedDiscussion.length +
          enrichedGovernanceAndProtocol.governance.length +
          enrichedGovernanceAndProtocol.protocol.length,
        notifications_link: config.SERVER_URL,
        email_notifications_enabled:
          existingPreferences?.email_notifications_enabled || false,
      };
    },
  };
}
