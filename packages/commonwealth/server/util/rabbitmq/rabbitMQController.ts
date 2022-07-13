import Rascal from 'rascal';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export class RabbitMQController {
  public broker: Rascal.BrokerAsPromised;
  public readonly subscribers: string[];
  public readonly publishers: string[];
  private readonly _rawVhost: any;

  constructor(private readonly _rabbitMQConfig: Rascal.BrokerConfig) {
    // sets the first vhost config to _rawVhost
    this._rawVhost = _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];

    // array of subscribers
    this.subscribers = Object.keys(this._rawVhost.subscriptions);

    // array of publishers
    this.publishers = Object.keys(this._rawVhost.publications);
  }

  public async init(): Promise<void> {
    log.info(
      `Rascal connecting to RabbitMQ: ${this._rawVhost.connection}`
    );

    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig)
    );



    this.broker.on('error', (err, { vhost, connectionUrl }) => {
      log.error(`Broker error on vhost: ${vhost} using url: ${connectionUrl}`, err)
    });
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

  /**
   * This function subscribes to a subscription defined in the RabbitMQ/Rascal config
   * @param messageProcessor The function to run for every message
   * @param subscriptionName The name of the subscription from the RabbitMQ/Rascal config file to start
   */
  public async startSubscription(
    messageProcessor: (data: any) => Promise<void>,
    subscriptionName: string
  ): Promise<any> {
    let subscription: Rascal.SubscriberSessionAsPromised;
    log.info(`Subscribing to ${subscriptionName}`);
    try {
      if (!this.subscribers.includes(subscriptionName))
        throw new Error('Subscription does not exist');
      subscription = await this.broker.subscribe(subscriptionName);
      subscription.on('message', (message, content, ackOrNack) => {
        try {
          messageProcessor(content);
          ackOrNack();
        } catch (e) {
          ackOrNack(e, [{strategy: 'republish', defer: 2000, attempts: 3}, {strategy: 'nack'}])
        }
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  public async publish(data: any, publisherName: string): Promise<any> {
    if (!this.publishers.includes(publisherName))
      throw new Error('Publisher is not defined');

    try {
      const publication = await this.broker.publish(publisherName, data);
      publication.on('error', (err, messageId) => {
        log.error(`Publisher error ${messageId}`, err);
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }
}
