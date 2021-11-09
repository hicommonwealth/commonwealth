import Rascal from 'rascal';
import { CWEvent } from '@commonwealth/chain-events';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export interface IConsumer {
  broker: Rascal.BrokerAsPromised;
  init: () => Promise<void>;
}

export class Consumer implements IConsumer {
  public broker: Rascal.BrokerAsPromised;
  private readonly _subscribers: string[];
  private _vhost: Rascal.VhostConfig;

  constructor(private readonly _rabbitMQConfig: Rascal.BrokerConfig) {
    // sets _vhost as the first vhost in the configuration passed
    this._vhost = _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];

    this._subscribers = Object.keys(this._vhost.subscriptions);
  }

  public async init(): Promise<void> {
    log.info(
      `Rascal connecting to RabbitMQ: ${this._vhost.connection as string}`
    );
    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig)
    );

    this.broker.on('error', log.error);
    this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
      log.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`
      );
    });
    this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
      log.warn(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`
      );
    });
    this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
      log.info(
        `Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`
      );
    });
  }

  public async consumeEvents(
    eventProcessor: (event: CWEvent) => Promise<void>,
    queueName: string
  ): Promise<any> {
    let subscription: Rascal.SubscriberSessionAsPromised;
    log.info(`Subscribing to ${queueName}`);
    try {
      if (!this._subscribers.includes(queueName))
        throw new Error('Subscription does not exist');
      subscription = await this.broker.subscribe(queueName);
      subscription.on('message', (message, content, ackOrNack) => {
        try {
          eventProcessor(content);
          ackOrNack();
        } catch (e) {
          ackOrNack(e, [{strategy: 'republish', defer: 2000, attempts: 3}, {strategy: 'nack'}])
        }

      });
      // @ts-ignore
      subscription.on('error', (err, messageId, ackOrNack) => {
        log.error(`Publisher error: ${err} ${messageId}`);
        ackOrNack(err, {strategy: 'nack'})
      });
      subscription.on('invalid_content', (err, message, ackOrNack) => {
        log.error(`Invalid content`, err);
        ackOrNack(err, {strategy: 'nack'})
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
    return subscription;
  }
}
