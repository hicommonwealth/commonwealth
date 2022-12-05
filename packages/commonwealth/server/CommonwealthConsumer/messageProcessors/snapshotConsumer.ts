import axios from 'axios';
import { factory, formatFilename } from 'common-common/src/logging';
import { SnapshotNotification } from '../../../shared/types';
import {DB} from "../../models";


export async function processSnapshotMessage(this: {models: DB}, data: SnapshotNotification) {
  const log = factory.getLogger(formatFilename(__filename));
  try {
    console.log('Processing snapshot message', data);
    const { space, id, title, body, choices, start, expire } = data;

    const eventType = data.event;
    let proposal = await this.models.SnapshotProposal.findOne({
      where: { id: data.id },
    });

    await this.models.SnapshotSpace.findOrCreate({
      where: { snapshot_space: space },
    });

    if (eventType === 'proposal/created' && proposal) {
      log.error(`Proposal already exists, cannot create`);
      return;
    }

    if (!proposal) {
      proposal = await this.models.SnapshotProposal.create({
        id,
        title,
        body,
        choices,
        space,
        start,
        expire,
      });
    }

    if (eventType === 'proposal/deleted') {
      console.log('Deleting proposal');
      await proposal.destroy();
    }

    const associatedCommunities = await this.models.CommunitySnapshotSpaces.findAll({
      where: { snapshot_space_id: space },
    });

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
            await axios.post(
              `${process.env.DISCORD_BOT_URL}/send-snapshot-notification`,
              {
                snapshotNotificationData: {
                  space,
                  id,
                  title,
                  body,
                  choices,
                  start,
                  expire,
                },
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
            console.log(
              'Error sending snapshot notification to discord bot',
              e
            );
          }
        }
      }
    }
  } catch (err) {
    log.error(`Error processing snapshot message: ${err}`);
  }
}
