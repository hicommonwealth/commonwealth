import { EventHandler, Policy, events } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import {
  ISnapshotNotificationData,
  NotificationCategories,
  SnapshotEventType,
} from '@hicommonwealth/shared';
import axios from 'axios';
import { Op } from 'sequelize';
import { fileURLToPath } from 'url';
import { ZodUndefined } from 'zod';
import emitNotifications from '../../../util/emitNotifications';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export const processSnapshotProposalCreated: EventHandler<
  'SnapshotProposalCreated',
  ZodUndefined
> = async ({ payload }) => {
  const { space, id, title, body, choices, start, expire, event } = payload;

  // Sometimes snapshot-listener will receive a webhook event from a
  // proposal that no longer exists. In that event, we will receive null data
  // from the listener. We can't do anything with that data, so we skip it.
  if (!space && event !== SnapshotEventType.Deleted) {
    log.info('Event received with invalid proposal, skipping');
    return;
  }

  const snapshotNotificationData: ISnapshotNotificationData = {
    space,
    id,
    title,
    body,
    choices,
    start: String(start),
    expire: String(expire),
    eventType: event as SnapshotEventType,
  };

  log.info(`Processing snapshot message`, payload);

  const associatedCommunities = await models.Community.findAll({
    where: {
      snapshot_spaces: {
        [Op.contains]: [space],
      },
    },
  });

  log.info(
    `Found ${associatedCommunities.length} associated communities for snapshot space ${space} `,
  );

  if (associatedCommunities.length > 0) {
    // Notifications
    emitNotifications(models, {
      categoryId: NotificationCategories.SnapshotProposal,
      data: snapshotNotificationData,
    }).catch((err) => {
      log.error('Error sending snapshot notification', err);
    });
  }

  for (const community of associatedCommunities) {
    const communityId = community.id;
    const communityDiscordConfig = await models.DiscordBotConfig.findAll({
      where: {
        community_id: communityId,
      },
    });

    for (const config of communityDiscordConfig) {
      if (config.snapshot_channel_id) {
        // Pass data to Discord bot
        try {
          log.info(
            `Sending snapshot notification to discord bot for community ${communityId} and snapshot space ${space} `,
          );
          await axios.post(
            `${process.env.DISCORD_BOT_URL}/send-snapshot-notification`,
            {
              snapshotNotificationData,
              guildId: config.guild_id,
              channelId: config.snapshot_channel_id,
              eventType: event,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            },
          );
        } catch (e) {
          // TODO: should we NACK the message if sending to discord fails or just rollbar report it and continue?
          log.error('Error sending snapshot notification to discord', e);
          console.log('Error sending snapshot notification to discord bot', e);
        }
      }
    }
  }
};

const snapshotInputs = {
  SnapshotProposalCreated: events.SnapshotProposalCreated,
};
export function SnapshotPolicy(): Policy<typeof snapshotInputs, ZodUndefined> {
  return {
    inputs: snapshotInputs,
    body: {
      SnapshotProposalCreated: processSnapshotProposalCreated,
    },
  };
}
