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
import { RABBITMQ_URI } from '../utils/config';
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
    //TODO: Need to include discord metadata(ie author and channelId(of thread))
    const create_thread = {
      topic_id: topic['id'],
      title: parsedMessage.title,
      body: parsedMessage.content,
      stage: 'discussion',
      kind: 'discussion',
      url: null,
      readOnly: false,
      canvas_action: null,
      canvas_hash: null,
      canvas_session: null,
    };
    console.log(create_thread);
    //TODO: If not title(comment) need to look up thread id from channel_id
  };
  await controller.startSubscription(
    processMessage,
    RascalSubscriptions.DiscordListener
  );
}

consumeMessages();
