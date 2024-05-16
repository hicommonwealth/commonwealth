import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  GetRecapEmailData,
  KnockChannelIds,
  Query,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Knock } from '@knocklabs/node';
import { QueryTypes } from 'sequelize';
import z from 'zod';

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

  while (
    oldestFetched > sevenDaysAgo &&
    (discussion.length < 10 || governance.length < 10 || protocol.length < 10)
  ) {
    const messages = await knock.users.getMessages(userId, {
      page_size: 2,
      channel_id: KnockChannelIds.InApp,
      after: cursor,
    });

    if (!messages.items.length) {
      break;
    }

    cursor = messages.items[messages.items.length - 1].__cursor;
    oldestFetched = new Date(
      messages.items[messages.items.length - 1].inserted_at,
    );

    for (const message of messages.items) {
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
  const enrichedDiscussion = [];
  const enrichedGovernance = [];
  const enrichedProtocol = [];

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
        addressIds: discussion.map((n) => {
          if ('comment_created_event' in n) {
            return n.comment_created_event.address_id;
          } else {
            return n.address_id;
          }
        }),
      },
    },
  );

  for (const notif of discussion) {
    if ('comment_created_event' in notif) {
      enrichedDiscussion.push({
        ...notif,
        author_avatar_url:
          discussionAvatars[0]?.user_avatars[
            notif.comment_created_event.address_id
          ],
      });
    } else {
      // TODO: add author or address id to user mentioned notifications
    }
  }

  for (const notif of governance) {
    // TODO: add community_id to chain/snapshot proposal notifications
  }

  for (const notif of protocol) {
    // TODO: add community_id to community stake notifications
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
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const notifications = await getMessages(payload.user_id);
      return await enrichNotifications(notifications);
    },
  };
}
