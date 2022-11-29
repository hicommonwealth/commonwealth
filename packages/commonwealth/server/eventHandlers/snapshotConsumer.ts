import {
  ServiceConsumer,
  RabbitMQSubscription,
} from 'common-common/src/serviceConsumer';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import axios from 'axios';
import {
  getRabbitMQConfig,
  RascalSubscriptions,
} from 'common-common/src/rabbitmq';
import { factory, formatFilename } from 'common-common/src/logging';
import { SnapshotNotification } from '../../shared/types';
import models from '../database';
import { RABBITMQ_URI } from '../config';

async function processSnapshotMessage(msg: SnapshotNotification) {
  const log = factory.getLogger(formatFilename(__filename));
  try {
    console.log('Processing snapshot message', msg);
    const { space, id, title, body, choices, start, expire } = msg;

    const eventType = msg.event;
    let proposal = await models.SnapshotProposal.findOne({
      where: { id: msg.id },
    });

    await models.SnapshotSpace.findOrCreate({
      where: { snapshot_space: space },
    });

    if (eventType === 'proposal/created' && proposal) {
      log.error(`Proposal already exists, cannot create`);
      return;
    }

    if (!proposal) {
      proposal = await models.SnapshotProposal.create({
        id,
        title,
        body,
        choices,
        space,
        start,
        expire,
      });
    }

    const associatedCommunities = await models.CommunitySnapshotSpaces.findAll({
      where: { snapshot_space_id: space },
    });

    for (const community of associatedCommunities) {
      const communityId = community.chain_id;
      const communityDiscordConfig = await models.DiscordBotConfig.findAll({
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

function createSnapshotSubscription(): RabbitMQSubscription {
  return {
    messageProcessor: processSnapshotMessage,
    subscriptionName: RascalSubscriptions.SnapshotListener,
  };
}

async function startSnapshotConsumer() {
  try {
    const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
    const subscriptions = [createSnapshotSubscription()];

    const consumer = new ServiceConsumer(
      RascalSubscriptions.SnapshotListener,
      controller,
      subscriptions
    );

    await consumer.init();
  } catch (err) {
    console.log(err);
  }
}

export default startSnapshotConsumer;
