import Rascal from 'rascal';
import { CWEvent, IEventHandler } from '@commonwealth/chain-events';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export interface IConsumer {
  broker: Rascal.BrokerAsPromised;
  init: () => Promise<void>;
}

export class Consumer implements IConsumer {
  public broker;
  private readonly _subscribers;
  private _vhost;

  constructor(private readonly _rabbitMQConfig: any) {
    // sets _vhost as the first vhost in the configuration passed
    this._vhost =
      _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];

    this._subscribers = Object.keys(this._vhost.subscriptions);
  }

  public async init(): Promise<void> {
    log.info(
      `Rascal connecting to RabbitMQ: ${this._vhost.connection}`
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
    let subscription;
    log.info(`Subscribing to ${queueName}`);
    try {
      if (!this._subscribers.includes(queueName))
        throw new Error('Subscription does not exist');
      subscription = await this.broker.subscribe(queueName);
      subscription
        .on('message', (message, content, ackOrNack) => {
          eventProcessor(content);
          ackOrNack();
        })
        .on('error', (err, messageId) => {
          log.error(`Publisher error ${err}, ${messageId}`);
        })
        .on('invalid_content', (err, message, ackOrNack) => {
          log.error(`Invalid content ${err}`);
          // ackOrNack(err); // TODO: this should forward to dead letter queue that handles events that created errors
        });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
    return subscription;
  }
}
