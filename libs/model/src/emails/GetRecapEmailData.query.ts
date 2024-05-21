import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  ExternalServiceUserIds,
  GetRecapEmailData,
  KnockChannelIds,
  logger,
  notificationsProvider,
  Query,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import z from 'zod';
import { models } from '..';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

type DiscussionNotifications = Array<
  | z.infer<typeof CommentCreatedNotification>
  | z.infer<typeof UserMentionedNotification>
>;
type GovernanceNotifications = Array<
  | z.infer<typeof ChainProposalsNotification>
  | z.infer<typeof SnapshotProposalCreatedNotification>
>;
type ProtocolNotifications = Array<z.infer<typeof CommunityStakeNotification>>;

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
        case WorkflowKeys.UserMentioned:
          discussion.push(message.data);
          break;
        case WorkflowKeys.ChainProposals:
        case WorkflowKeys.SnapshotProposals:
          governance.push(message.data);
          break;
        case WorkflowKeys.CommunityStake:
          protocol.push(message.data);
          break;
      }
    }
  }

  return { discussion, governance, protocol };
}

async function enrichDiscussionNotifications(
  discussion: DiscussionNotifications,
): Promise<z.infer<typeof GetRecapEmailData['output']>['discussion']> {
  if (!discussion.length) return [];

  const enrichedDiscussion: z.infer<
    typeof GetRecapEmailData['output']
  >['discussion'] = [];

  const addressIds = Array.from(
    new Set(
      discussion.map((n) => {
        if ('comment_created_event' in n) {
          return n.comment_created_event.address_id;
        } else {
          return n.author_address_id;
        }
      }),
    ),
  );

  if (!addressIds.length && discussion.length) {
    log.error('Address ids not found!', undefined, {
      discussion,
    });
    return [];
  }

  const discussionAvatars = await models.sequelize.query<{
    user_avatars: { [user_id: string]: string };
  }>(
    `
        SELECT JSONB_OBJECT_AGG(A.id, P.avatar_url) as user_avatars
        FROM "Addresses" A
                 JOIN "Profiles" P ON A.profile_id = P.id
        WHERE A.id IN (:addressIds);
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        addressIds,
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
  governance: z.infer<typeof GetRecapEmailData['output']>['governance'];
  protocol: z.infer<typeof GetRecapEmailData['output']>['protocol'];
}> {
  const enrichedGovernance: z.infer<
    typeof GetRecapEmailData['output']
  >['governance'] = [];
  const enrichedProtocol: z.infer<
    typeof GetRecapEmailData['output']
  >['protocol'] = [];
  const communityIds = Array.from(
    new Set([...governance, ...protocol].map((i) => i.community_id)),
  );

  if (!communityIds.length) {
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
        communityIds,
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
      };
    },
  };
}
