import * as Rascal from 'rascal';
import {factory, formatFilename} from 'common-common/src/logging';
import {RascalPublications, RascalSubscriptions, RmqMsgFormatError, TRmqMessages} from "./types";
import Rollbar from "rollbar";

const log = factory.getLogger(formatFilename(__filename));


export class RabbitMQControllerError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, RabbitMQControllerError.prototype);
  }
}

class PublishError extends RabbitMQControllerError {
  constructor(msg: string) {
    super(`Error publishing. ${msg}`);
    Object.setPrototypeOf(this, PublishError.prototype);
  }
}

export class RabbitMQController {
  public broker: Rascal.BrokerAsPromised;
  public readonly subscribers: string[];
  public readonly publishers: string[];
  protected readonly _rawVhost: any;
  protected _initialized: boolean = false;
  protected rollbar: Rollbar;

  constructor(protected readonly _rabbitMQConfig: Rascal.BrokerConfig, rollbar?: Rollbar) {
    // sets the first vhost config to _rawVhost
    this._rawVhost = _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];

    // array of subscribers
    this.subscribers = Object.keys(this._rawVhost.subscriptions);

    // array of publishers
    this.publishers = Object.keys(this._rawVhost.publications);

    this.rollbar = rollbar;
  }

  public async init(): Promise<void> {
    log.info(
      `Rascal connecting to RabbitMQ: ${this._rawVhost.connection}`
    );

    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig)
    );

    this.broker.on('error', (err, {vhost, connectionUrl}) => {
      log.error(`Broker error on vhost: ${vhost} using url: ${connectionUrl}`, err)
    });
    this.broker.on('vhost_initialized', ({vhost, connectionUrl}) => {
      log.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`
      );
    });
    this.broker.on('blocked', (reason, {vhost, connectionUrl}) => {
      log.warn(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`
      );
    });
    this.broker.on('unblocked', ({vhost, connectionUrl}) => {
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
    messageProcessor: (data: TRmqMessages, ...args: any) => Promise<void>,
    subscriptionName: RascalSubscriptions,
    msgProcessorContext?: { [key: string]: any }
  ): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError("RabbitMQController is not initialized!")
    }

    let subscription: Rascal.SubscriberSessionAsPromised;
    if (!this.subscribers.includes(subscriptionName))
      throw new RabbitMQControllerError('Subscription does not exist');

    try {
      log.info(`Subscribing to ${subscriptionName}`);
      subscription = await this.broker.subscribe(subscriptionName);
      subscription.on('message', (message, content, ackOrNack) => {
        messageProcessor.call({rmqController: this, ...msgProcessorContext}, content)
          .then(() => {
            console.log("Message Acked")
            ackOrNack();
          })
          .catch((e) => {
            const errorMsg = `Failed to process message: ${JSON.stringify(content)} with processor function ${messageProcessor.name} and context ${JSON.stringify(msgProcessorContext)}`
            // if the message processor throws because of a message formatting error then we immediately deadLetter the
            // message to avoid re-queuing the message multiple times
            if (e instanceof RmqMsgFormatError) {
              log.error(`Invalid Message Format Error - ${errorMsg}`, e);
              this.rollbar?.warn(`Invalid Message Format - ${errorMsg}`, e)
              ackOrNack(e, {strategy: 'nack'});
            }
            else {
              log.error(`Unknown Error - ${errorMsg}`, e)
              this.rollbar?.warn(`Unknown Error - ${errorMsg}`, e)
              ackOrNack(e, [{strategy: 'republish', defer: 2000, attempts: 3}, {strategy: 'nack'}]);
            }
          })
      });
      subscription.on('error', (err) => {
        log.error(`Subscriber error: ${err}`);
        this.rollbar?.warn(`Subscriber error: ${err}`);
      });
      subscription.on('invalid_content', (err, message, ackOrNack) => {
        log.error(`Invalid content`, err);
        ackOrNack(err, {strategy: 'nack'});
        this.rollbar?.warn(`Invalid content`, err);
      });
    } catch (err) {
      throw new RabbitMQControllerError(`${err.message}`);
    }
    return subscription;
  }

  // TODO: add a class property that takes an object from publisherName => callback function
  //      if a message is successfully published to a particular queue then the callback is executed
  public async publish(data: TRmqMessages, publisherName: RascalPublications): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError("RabbitMQController is not initialized!")
    }

    if (!this.publishers.includes(publisherName))
      throw new RabbitMQControllerError('Publisher is not defined');

    let publication;
    try {
      publication = await this.broker.publish(publisherName, data);
      publication.on('error', (err, messageId) => {
        log.error(`Publisher error ${messageId}`, err);
        this.rollbar?.warn(`Publisher error ${messageId}`, err);
        throw new PublishError(err.message);
      });
    } catch (err) {
      if (err instanceof PublishError) throw err;
      else throw new RabbitMQControllerError(`Rascal config error: ${err.message}`)
    }
  }

  public async shutdown() {
    await this.broker.shutdown();
    this._initialized = false;
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
