import axios from 'axios';
import { Logger } from 'typescript-logging';
import { StatsDController } from 'common-common/src/statsd';
import { SnapshotNotification } from '../../../shared/types';
import { DB } from '../../models';

export async function processSnapshotMessage(
  this: { models: DB; log: Logger },
  data: SnapshotNotification
) {
  const { space, id, title, body, choices, start, expire } = data;

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

  const eventType = data.event;
  let proposal;

  try {
    proposal = await this.models.SnapshotProposal.findOne({
      where: { id: data.id },
    });
  } catch (e) {
    this.log.error(`Error fetching proposal: ${e}`);
  }

  if (eventType === 'proposal/deleted') {
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
    await this.models.SnapshotSpace.findOrCreate({
      where: { snapshot_space: space ?? proposal.space },
    });
  } catch (e) {
    this.log.error(`Error creating snapshot space: ${e}`);
  }

  if (
    eventType === 'proposal/created' &&
    proposal &&
    !proposal.is_upstream_deleted
  ) {
    this.log.info(`Proposal ${id} already exists`);
    return;
  }

  if (!proposal && eventType !== 'proposal/deleted') {
    this.log.info(`Proposal ${id} does not exist, creating record`);
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
    `Found ${associatedCommunities.length} associated communities for snapshot space ${space} `
  );

  for (const community of associatedCommunities) {
    const communityId = community.chain_id;
    const communityDiscordConfig = await this.models.DiscordBotConfig.findAll({
      where: {
        chain_id: communityId,
      },
    });

    for (const config of communityDiscordConfig) {
      if (config.snapshot_channel_id) {
        // Pass data to Discord bot
        try {
          this.log.info(
            `Sending snapshot notification to discord bot for community ${communityId} and snapshot space ${space} `
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
            }
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
