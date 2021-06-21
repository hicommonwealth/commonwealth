import Rascal from 'rascal';
import { CWEvent } from '@commonwealth/chain-events';
import config from './RabbitMQconfig.json';
import { factory, formatFilename } from '../../../shared/logging';


const log = factory.getLogger(formatFilename(__filename));

export interface IConsumer {
    broker: Rascal.BrokerAsPromised;
    init: () => Promise<void>;
}

export class Consumer implements IConsumer {
    public broker;

    public async init(): Promise<void> {
      const cnct = config.vhosts['/'].connection;
      log.info(
        `Rascal connecting to RabbitMQ: ${cnct.protocol}://${cnct.user}:*****@${cnct.hostname}:${cnct.port}/`
      );
      this.broker = await Rascal.BrokerAsPromised.create(
        Rascal.withDefaultConfig(config)
      );
      this.broker.on('error', log.error);
      this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
        log.info(
          `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`
        );
      });
      this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
        log.info(
          `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`
        );
      });
      this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
        log.info(
          `Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`
        );
      });
    }

    public async consumeEvents(eventProcessor: (event: CWEvent) => Promise<void>): Promise<any> {
      try {
        const subscription = await this.broker.subscribe('eventsSub');
        subscription.on('message', (message, content, ackOrNack) => {
          eventProcessor(content);
          // console.log(message, content);
        }).on('error', (err, messageId) => {
          log.error(`Publisher error ${err}, ${messageId}`);
        });
      } catch (err) {
        throw new Error(`Rascal config error: ${err.message}`);
      }
    }
}
