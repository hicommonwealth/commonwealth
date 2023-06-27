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
import { RABBITMQ_URI, SERVER_URL } from '../utils/config';
import axios from 'axios';
/*
NOTE: THIS IS ONLY WIP CURRENTLY AND WILL BE COMPLETED AS PART OF #4267 
*/
const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));

async function consumeMessages() {
  await controller.init();

  const processMessage = async (data: TRmqMessages) => {
    console.log(data);
    const parsedMessage = data as IDiscordMessage;
    const topic: any = (
      await sequelize.query(
        `Select * from "Topics" WHERE channel_id = '${parsedMessage.parent_channel_id}'`
      )
    )[0][0];

    const jwt = ''
    const profile: any = {
      
    };

    //TODO: Need to include discord metadata(ie author and channelId(of thread))
    if (parsedMessage.title) {
      const create_thread = {
        author_chain: topic['chain_id'],
        author: JSON.stringify(profile),
        address: profile['_address'],
        chain: topic['chain_id'],
        topic_id: topic['id'],
        topic_name: topic['name'],
        title: encodeURIComponent(parsedMessage.title),
        body: encodeURIComponent(parsedMessage.content),
        stage: 'discussion',
        kind: 'discussion',
        url: null,
        readOnly: false,
        jwt,
        canvas_action: null,
        canvas_hash: null,
        canvas_session: null,
        discord_meta: {
          channel_id: parsedMessage.channel_id,
          user: parsedMessage.user,
        }, //TODO 1. Need server side + migration for this
        //discord_user: {} //TODO 2. Need server side + migration for this
      };

      const response = await axios.post(
        `http://${SERVER_URL}/api/createThread`,
        create_thread
      );
    } else {
      const thread_id = (
        await sequelize.query(
          `SELECT id FROM "Threads" WHERE discord_meta->>'channel_id' = '${parsedMessage.channel_id}'`
        )
      )[0][0]['id'];
      console.log('threadId', thread_id);
      const create_comment = {
        author_chain: topic['chain_id'],
        address: profile['_address'],
        chain: topic['chain_id'],
        parentCommentId: null,
        text: encodeURIComponent(parsedMessage.content),
        jwt,
        canvas_action: null,
        canvas_hash: null,
        canvas_session: null,
        //discord_user: {} //TODO 3. Need server side + migration for this
      };

      const response = await axios.post(
        `http://${SERVER_URL}/api/threads/${thread_id}/comments`,
        create_comment
      );
    }

    //TODO: If not title(comment) need to look up thread id from channel_id
  };
  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.DiscordListener
  );
}

consumeMessages();
