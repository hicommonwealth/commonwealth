import amqp, { Connection } from 'amqplib/callback_api'
import { Logger } from 'tslog';

const log: Logger = new Logger({ name: 'producer-logger' });

const createMQProducer = (amqpUrl: string, queueName: string) => {
  let ch: any
  amqp.connect(amqpUrl, (errorConnect: Error, connection: Connection) => {
    if (errorConnect) {
      log.error(`Error connecting to RabbitMQ: ${errorConnect}`);
      return
    }

    connection.createChannel((errorChannel, channel) => {
      if (errorChannel) {
        log.error(`Error creating channel: ${errorChannel}`);
        return
      }

      ch = channel
    })
  })

  return (msg: string) => {
    try{ 
      switch (msg) {
        case '':
          log.error('Message cannot be empty');
          throw new Error('Message cannot be empty');
        case undefined:
          log.error('Message cannot be undefined');
          throw new Error('Message cannot be undefined');
        case null:
          log.error('Message cannot be null');
          throw new Error('Message cannot be null');
        default:
          log.info(`Sending message to queue ${queueName}`);
          ch.sendToQueue(queueName, Buffer.from(msg))
      }
    } catch (error) {
      console.log('Error producing message: ', error)
      throw error
    }
  }
}

export default createMQProducer








