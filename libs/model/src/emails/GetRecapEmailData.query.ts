import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  GetRecapEmailData,
  KnockChannelIds,
  notificationsProvider,
  Query,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Knock } from '@knocklabs/node';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { isKnockService } from '../middleware';

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
  const knock = new Knock(
    'sk_test_nhLIMpw9kp3tyaFqtJyzH-WYJ8rt85YXUCSm08-5-mo',
  );

  let discussion: DiscussionNotifications = [];
  let governance: GovernanceNotifications = [];
  let protocol: ProtocolNotifications = [];

  let sevenDaysAgo = new Date(new Date().getTime() - 604_800_000);
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

async function enrichNotifications({
  discussion,
  governance,
  protocol,
}: {
  discussion: DiscussionNotifications;
  governance: GovernanceNotifications;
  protocol: ProtocolNotifications;
}): Promise<z.infer<typeof GetRecapEmailData['output']>> {
  const enrichedDiscussion: z.infer<
    typeof GetRecapEmailData['output']
  >['discussion'] = [];
  const enrichedGovernance: z.infer<
    typeof GetRecapEmailData['output']
  >['governance'] = [];
  const enrichedProtocol: z.infer<
    typeof GetRecapEmailData['output']
  >['protocol'] = [];

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
        addressIds: Array.from(
          new Set(
            discussion.map((n) => {
              if ('comment_created_event' in n) {
                return n.comment_created_event.address_id;
              } else {
                return n.author_address_id;
              }
            }),
          ),
        ),
      },
    },
  );

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
        communityIds: Array.from(
          new Set([...governance, ...protocol].map((i) => i.community_id)),
        ),
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
    discussion: enrichedDiscussion,
    governance: enrichedGovernance,
    protocol: enrichedProtocol,
  };
}

export function GetRecapEmailDataQuery(): Query<typeof GetRecapEmailData> {
  return {
    ...GetRecapEmailData,
    auth: [isKnockService],
    secure: true,
    body: async ({ payload }) => {
      const notifications = await getMessages(payload.user_id);
      return await enrichNotifications(notifications);
    },
  };
}
