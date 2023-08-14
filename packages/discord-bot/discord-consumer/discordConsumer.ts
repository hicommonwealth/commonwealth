import {
  RabbitMQController,
  getRabbitMQConfig,
} from 'common-common/src/rabbitmq';
import { sequelize } from '../utils/database';
import {
  RascalSubscriptions,
  TRmqMessages,
} from 'common-common/src/rabbitmq/types';
import { DiscordAction, IDiscordMessage } from 'common-common/src/types';
import { RABBITMQ_URI, SERVER_URL, CW_BOT_KEY } from '../utils/config';
import axios from 'axios';
import v8 from 'v8';
import { factory, formatFilename } from 'common-common/src/logging';
import { StatsDController } from 'common-common/src/statsd';
import {
  ServiceKey,
  startHealthCheckLoop,
} from 'common-common/src/scripts/startHealthCheckLoop';

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.DiscordBotConsumer,
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

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

      const action = parsedMessage.action as DiscordAction;

      if (action === 'thread-delete') {
        await axios.delete(
          `${SERVER_URL}/api/bot/threads/${parsedMessage.message_id}`,
          { data: { auth: CW_BOT_KEY, address: '0xdiscordbot' } }
        );
        return;
      }

      if (parsedMessage.title) {
        const thread = {
          author_chain: topic['chain_id'],
          address: '0xdiscordbot',
          chain: topic['chain_id'],
          topic_id: topic['id'],
          topic_name: topic['name'],
          title: encodeURIComponent(parsedMessage.title),
          body: encodeURIComponent(
            `[Go to Discord post](https://discord.com/channels/${parsedMessage.guild_id}/${parsedMessage.channel_id}) \n\n` +
              parsedMessage.content +
              parsedMessage.imageUrls
                .map((url) => `\n\n![image](${url})`)
                .join('')
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
          bot_name: 'discord',
        };

        if (action === 'create') {
          await axios.post(`${SERVER_URL}/api/bot/threads`, thread);
        } else if (action === 'update') {
          await axios.patch(`${SERVER_URL}/api/bot/threads`, thread);
        }

        StatsDController.get().increment('cw.discord_thread_added', 1, {
          chain: topic['chain_id'],
        });
      } else {
        const thread_id = (
          await sequelize.query(
            `SELECT id FROM "Threads" WHERE discord_meta->>'message_id' = '${parsedMessage.channel_id}'`
          )
        )[0][0]['id'];

        const comment = {
          author_chain: topic['chain_id'],
          address: '0xdiscordbot',
          chain: topic['chain_id'],
          parentCommentId: null,
          text: encodeURIComponent(parsedMessage.content),
          canvas_action: null,
          canvas_hash: null,
          canvas_session: null,
          auth: CW_BOT_KEY,
          bot_name: 'discord',
          discord_meta: {
            message_id: parsedMessage.message_id,
            channel_id: parsedMessage.parent_channel_id,
            user: parsedMessage.user,
          },
        };

        if (action === 'create') {
          await axios.post(
            `${SERVER_URL}/api/bot/threads/${thread_id}/comments`,
            comment
          );
        } else if (action === 'update') {
          await axios.patch(
            `${SERVER_URL}/api/bot/threads/${thread_id}/comments`,
            {
              body: comment.text,
              discord_meta: comment.discord_meta,
              auth: CW_BOT_KEY,
              address: '0xdiscordbot',
              chain: comment.chain,
              author_chain: comment.author_chain,
            }
          );
        } else if (action === 'comment-delete') {
          await axios.delete(
            `${SERVER_URL}/api/bot/comments/${parsedMessage.message_id}`,
            {
              data: {
                auth: CW_BOT_KEY,
                address: '0xdiscordbot',
                chain: comment.chain,
                author_chain: comment.author_chain,
              },
            }
          );
        }

        StatsDController.get().increment('cw.discord_comment_added', 1, {
          chain: topic['chain_id'],
        });
      }
    } catch (error) {
      log.error(`Failed to process Message:`, error);
    }
  };
  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.DiscordListener
  );

  isServiceHealthy = true;
}

consumeMessages();
