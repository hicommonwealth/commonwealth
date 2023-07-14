import {
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import { sequelize } from '../utils/database';
import {
  RascalSubscriptions,
  TRmqMessages,
} from 'common-common/src/rabbitmq/types';
import { IDiscordMessage } from 'common-common/src/types';
import { RABBITMQ_URI, SERVER_URL, CW_BOT_KEY } from '../utils/config';
import axios from 'axios';
import v8 from 'v8';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000
  )} GB`
);

/*
NOTE: THIS IS ONLY WIP CURRENTLY AND WILL BE COMPLETED AS PART OF #4267
*/
const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));

async function consumeMessages() {
  await controller.init();

  const processMessage = async (data: TRmqMessages) => {
    try {
      const parsedMessage = data as IDiscordMessage;
      const topic: any = (
        await sequelize.query(
          `Select * from "Topics" WHERE channel_id = '${parsedMessage.parent_channel_id}'`
        )
      )[0][0];

      if (parsedMessage.title) {
        const create_thread = {
          author_chain: topic['chain_id'],
          address: '0xdiscordbot',
          chain: topic['chain_id'],
          topic_id: topic['id'],
          topic_name: topic['name'],
          title: encodeURIComponent(parsedMessage.title),
          body: encodeURIComponent(
            `[Go to Discord post](https://discord.com/channels/${parsedMessage.guild_id}/${parsedMessage.channel_id}) \n\n` +
              parsedMessage.content
          ),
          stage: 'discussion',
          kind: 'discussion',
          url: null,
          readOnly: false,
          canvas_action: null,
          canvas_hash: null,
          canvas_session: null,
          discord_meta: {
            message_id: parsedMessage.message_id,
            channel_id: parsedMessage.parent_channel_id,
            user: parsedMessage.user,
          },
          auth: CW_BOT_KEY,
        };

        const response = await axios.post(
          `${SERVER_URL}/api/bot/threads`,
          create_thread
        );
        console.log(response.status, response.statusText);
      } else {
        const thread_id = (
          await sequelize.query(
            `SELECT id FROM "Threads" WHERE discord_meta->>'message_id' = '${parsedMessage.channel_id}'`
          )
        )[0][0]['id'];

        const create_comment = {
          author_chain: topic['chain_id'],
          address: '0xdiscordbot',
          chain: topic['chain_id'],
          parentCommentId: null,
          text: encodeURIComponent(parsedMessage.content),
          canvas_action: null,
          canvas_hash: null,
          canvas_session: null,
          auth: CW_BOT_KEY,
          discord_meta: {
            message_id: parsedMessage.message_id,
            channel_id: parsedMessage.parent_channel_id,
            user: parsedMessage.user,
          },
        };

        const response = await axios.post(
          `${SERVER_URL}/api/bot/threads/${thread_id}/comments`,
          create_comment
        );
        console.log(response.status, response.statusText);
      }
    } catch (error) {
      log.error(`Failed to process Message:`, error);
    }
  };
  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.DiscordListener
  );
}

consumeMessages();
