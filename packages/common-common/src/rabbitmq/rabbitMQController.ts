import Rascal from 'rascal';
import { factory, formatFilename } from 'common-common/src/logging';
import { RascalSubscriptions } from "./types";

const log = factory.getLogger(formatFilename(__filename));

export class RabbitMQController {
  public broker: Rascal.BrokerAsPromised;
  public readonly subscribers: string[];
  public readonly publishers: string[];
  private readonly _rawVhost: any;
  private _initialized: boolean = false;

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

    this._initialized = true;
  }

  /**
   * This function subscribes to a subscription defined in the RabbitMQ/Rascal config
   * @param messageProcessor The function to run for every message
   * @param subscriptionName The name of the subscription from the RabbitMQ/Rascal config file to start
   * @param msgProcessorContext An object containing the context that should be
   * used when calling the messageProcessor function
   */
  public async startSubscription(
    messageProcessor: (data: any, ...args: any) => Promise<void>,
    subscriptionName: string,
    msgProcessorContext?: {[key: string]: any}
  ): Promise<any> {
    if (!this._initialized) {
      throw new Error("RabbitMQController is not initialized!")
    }

    let subscription: Rascal.SubscriberSessionAsPromised;
    try {
      if (!this.subscribers.includes(subscriptionName))
        throw new Error('Subscription does not exist');

      log.info(`Subscribing to ${subscriptionName}`);
      subscription = await this.broker.subscribe(subscriptionName);
      subscription.on('message', (message, content, ackOrNack) => {
        try {
          if (msgProcessorContext) messageProcessor.call({rmqController: this, ...msgProcessorContext}, content);
          else messageProcessor(content);
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

  public async publish(data: any, publisherName: any): Promise<any> {
    if (!this._initialized) {
      throw new Error("RabbitMQController is not initialized!")
    }

    if (!this.publishers.includes(publisherName))
      throw new Error('Publisher is not defined');

    try {
      const publication = await this.broker.publish(publisherName, data);
      publication.on('error', (err, messageId) => {
        // TODO: we need guaranteed message delivery so attempt message delivery
        //  to dead-letter-queue with less requirements or send fatal error
        //  report with highest level priority to backend devs
        log.error(`Publisher error ${messageId}`, err);
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
