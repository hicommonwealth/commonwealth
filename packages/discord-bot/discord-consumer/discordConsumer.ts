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

/*
NOTE: THIS IS ONLY WIP CURRENTLY AND WILL BE COMPLETED AS PART OF #4267 
*/
const controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));

async function consumeMessages() {
  await controller.init();

  const processMessage = async (data: TRmqMessages) => {
    try{
      const parsedMessage = data as IDiscordMessage;
      const topic: any = (
        await sequelize.query(
          `Select * from "Topics" WHERE channel_id = '${parsedMessage.parent_channel_id}'`
        )
      )[0][0];

      
      const profile: any = {
        _address: '0xdiscordbot',
        _chain: topic['chain_id'],
        _name: 'Discord Bot',
        _avatarUrl: null,
        _id: 115326,
        _lastActive: '2023-06-27T14:28:43.067Z',
        _initialized: true,
      };

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
          canvas_action: null,
          canvas_hash: null,
          canvas_session: null,
          discord_meta: {
            channel_id: parsedMessage.channel_id,
            user: parsedMessage.user,
          }, 
          auth: CW_BOT_KEY
        };

        const response = await axios.post(
          `http://${SERVER_URL}/api/bot/createThread`,
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
          canvas_action: null,
          canvas_hash: null,
          canvas_session: null,
          auth: CW_BOT_KEY
          //discord_user: {} //TODO 3. Need server side + migration for this
        };

        const response = await axios.post(
          `http://${SERVER_URL}/api/bot/threads/${thread_id}/comments`,
          create_comment
        );
      }
    } catch(error){
      console.log(`Failed to process Message: ${error}`)
    }
  };
  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.DiscordListener
  );
}

consumeMessages();
