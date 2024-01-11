import {
  ILogger,
  RmqSnapshotNotification,
  StatsDController,
} from '@hicommonwealth/adapters';
import { NotificationCategories } from '@hicommonwealth/core';
import axios from 'axios';
import { SnapshotEventType } from 'types';
import type { DB } from '../../../models';
import emitNotifications from '../../../util/emitNotifications';

export async function processSnapshotMessage(
  this: { models: DB; log: ILogger },
  data: RmqSnapshotNotification.RmqMsgType,
) {
  const { space, id, title, body, choices, start, expire } = data;

  const eventType = data.event as SnapshotEventType;

  // Sometimes snapshot-listener will receive a webhook event from a
  // proposal that no longer exists. In that event, we will receive null data
  // from the listener. We can't do anything with that data, so we skip it.
  if (!space && eventType !== SnapshotEventType.Deleted) {
    this.log.info('Event received with invalid proposal, skipping');
    return;
  }

  let snapshotNotificationData = {
    space,
    id,
    title,
    body,
    choices,
    start,
    expire,
  };

  this.log.info(`Processing snapshot message: ${JSON.stringify(data)}`);

  let proposal;

  try {
    proposal = await this.models.SnapshotProposal.findOne({
      where: { id: data.id },
    });
  } catch (e) {
    this.log.error(`Error fetching proposal: ${e}`);
  }

  if (eventType === SnapshotEventType.Deleted) {
    if (!proposal || proposal?.is_upstream_deleted) {
      this.log.info(`Proposal ${id} does not exist, skipping`);
      return;
    }

    this.log.info(`Proposal deleted, marking as deleted in DB`);

    // Pull data from DB (not included in the webhook event)
    snapshotNotificationData = {
      space: proposal.space,
      id: proposal.id,
      title: proposal.title,
      body: proposal.body,
      choices: proposal.choices,
      start: proposal.start,
      expire: proposal.expire,
    };

    proposal.is_upstream_deleted = true;
    await proposal.save();

    StatsDController.get().increment('cw.deleted_snapshot_proposal_record', 1, {
      event: eventType,
      space,
    });
  }

  try {
    if (space || proposal.space) {
      await this.models.SnapshotSpace.findOrCreate({
        where: { snapshot_space: space ?? proposal.space },
      });
    }
  } catch (e) {
    this.log.error(`Error creating snapshot space: ${e}`);
  }

  if (
    eventType === SnapshotEventType.Created &&
    proposal &&
    !proposal.is_upstream_deleted
  ) {
    this.log.info(`Proposal ${id} already exists`);
    return;
  }

  if (!proposal && eventType !== SnapshotEventType.Deleted) {
    this.log.info(`Proposal ${id} does not exist, creating record`);
    // TODO: fix here
    proposal = await this.models.SnapshotProposal.create({
      id,
      title,
      body,
      choices,
      space,
      start,
      expire,
      event: eventType,
      is_upstream_deleted: false,
    });
  }

  StatsDController.get().increment('cw.created_snapshot_proposal_record', 1, {
    event: eventType,
    space,
  });

  const associatedCommunities =
    await this.models.CommunitySnapshotSpaces.findAll({
      where: { snapshot_space_id: proposal?.space },
    });

  this.log.info(
    `Found ${associatedCommunities.length} associated communities for snapshot space ${space} `,
  );

  if (associatedCommunities.length > 0) {
    // Notifications
    emitNotifications(this.models, {
      categoryId: NotificationCategories.SnapshotProposal,
      data: {
        eventType,
        ...snapshotNotificationData,
      },
    });
  }

  for (const community of associatedCommunities) {
    const communityId = community.community_id;
    const communityDiscordConfig = await this.models.DiscordBotConfig.findAll({
      where: {
        community_id: communityId,
      },
    });

    for (const config of communityDiscordConfig) {
      if (config.snapshot_channel_id) {
        // Pass data to Discord bot
        try {
          this.log.info(
            `Sending snapshot notification to discord bot for community ${communityId} and snapshot space ${space} `,
          );
          await axios.post(
            `${process.env.DISCORD_BOT_URL}/send-snapshot-notification`,
            {
              snapshotNotificationData,
              guildId: config.guild_id,
              channelId: config.snapshot_channel_id,
              eventType,
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
          this.log.error('Error sending snapshot notification to discord', e);
          console.log('Error sending snapshot notification to discord bot', e);
        }
      }
    }
  }
}
