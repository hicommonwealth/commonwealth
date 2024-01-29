import { ILogger, logger } from '@hicommonwealth/core';
import * as Rascal from 'rascal';
import type Rollbar from 'rollbar';
import type { Sequelize } from 'sequelize';
import type {
  RascalPublications,
  RascalSubscriptions,
  SafeRmqPublishSupported,
  TRmqMessages,
} from './types';
import { AbstractRabbitMQController, RmqMsgFormatError } from './types';

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

/**
 * This class encapsulates all interactions with a RabbitMQ instance. It allows publishing and subscribing to queues. To
 * initialize the class you must have a Rascal configuration. Every publish and message processing should be done
 * through this class as it implements error handling that is crucial to avoid data loss.
 */
export class RabbitMQController extends AbstractRabbitMQController {
  public broker: Rascal.BrokerAsPromised;
  public readonly subscribers: string[];
  public readonly publishers: string[];
  protected readonly _rawVhost: any;
  protected rollbar: Rollbar;
  private _log: ILogger;

  constructor(
    protected readonly _rabbitMQConfig: Rascal.BrokerConfig,
    rollbar?: Rollbar,
  ) {
    super();

    this._log = logger().getLogger(__filename);

    // sets the first vhost config to _rawVhost
    this._rawVhost =
      _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];

    // array of subscribers
    this.subscribers = Object.keys(this._rawVhost.subscriptions);

    // array of publishers
    this.publishers = Object.keys(this._rawVhost.publications);

    this.rollbar = rollbar;
  }

  public async init(): Promise<void> {
    this._log.info(
      `Rascal connecting to RabbitMQ: ${this._rawVhost.connection}`,
    );

    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig),
    );

    this.broker.on('error', (err, { vhost, connectionUrl }) => {
      this._log.error(
        `Broker error on vhost: ${vhost} using url: ${connectionUrl}`,
        err,
      );
    });
    this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
      this._log.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`,
      );
    });
    this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
      this._log.warn(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`,
      );
    });
    this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
      this._log.info(
        `Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`,
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
    msgProcessorContext?: { [key: string]: any },
  ): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError(
        'RabbitMQController is not initialized!',
      );
    }

    let subscription: Rascal.SubscriberSessionAsPromised;
    if (!this.subscribers.includes(subscriptionName))
      throw new RabbitMQControllerError('Subscription does not exist');

    try {
      this._log.info(`Subscribing to ${subscriptionName}`);
      subscription = await this.broker.subscribe(subscriptionName);

      subscription.on('message', (message, content, ackOrNack) => {
        messageProcessor
          .call({ rmqController: this, ...msgProcessorContext }, content)
          .then(() => {
            console.log('Message Acked');
            ackOrNack();
          })
          .catch((e) => {
            const errorMsg = `
              Failed to process message: ${JSON.stringify(content)} 
              with processor function ${messageProcessor.name}.
            `;
            // if the message processor throws because of a message formatting error then we immediately deadLetter the
            // message to avoid re-queuing the message multiple times
            if (e instanceof RmqMsgFormatError) {
              this._log.error(`Invalid Message Format Error - ${errorMsg}`, e);
              this.rollbar?.warn(`Invalid Message Format - ${errorMsg}`, e);
              ackOrNack(e, { strategy: 'nack' });
            } else {
              this._log.error(`Unknown Error - ${errorMsg}`, e);
              this.rollbar?.warn(`Unknown Error - ${errorMsg}`, e);
              ackOrNack(e, [
                { strategy: 'republish', defer: 2000, attempts: 3 },
                { strategy: 'nack' },
              ]);
            }
          });
      });
      subscription.on('error', (err) => {
        this._log.error(`Subscriber error: ${err}`);
        this.rollbar?.warn(`Subscriber error: ${err}`);
      });
      subscription.on('invalid_content', (err, message, ackOrNack) => {
        this._log.error(`Invalid content`, err);
        ackOrNack(err, { strategy: 'nack' });
        this.rollbar?.warn(`Invalid content`, err);
      });
    } catch (err) {
      throw new RabbitMQControllerError(`${err.message}`);
    }
    return subscription;
  }

  // TODO: add a class property that takes an object from publisherName => callback function
  //      if a message is successfully published to a particular queue then the callback is executed
  public async publish(
    data: TRmqMessages,
    publisherName: RascalPublications,
  ): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError(
        'RabbitMQController is not initialized!',
      );
    }

    if (!this.publishers.includes(publisherName))
      throw new RabbitMQControllerError('Publisher is not defined');

    let publication;
    try {
      publication = await this.broker.publish(publisherName, data);

      publication.on('error', (err, messageId) => {
        this._log.error(`Publisher error ${messageId}`, err);
        this.rollbar?.warn(`Publisher error ${messageId}`, err);
        throw new PublishError(err.message);
      });
    } catch (err) {
      if (err instanceof PublishError) throw err;
      else
        throw new RabbitMQControllerError(
          `Rascal config error: ${err.message}`,
        );
    }
  }

  /**
   * This function implements a method of publishing that guarantees eventual consistency. The function assumes that a
   * data record has already been entered in the source database, and now we need to publish a part of this data
   * record to a queue. Eventual consistency is achieved specifically by the 'queued' column of the data records. That
   * is, if the message is successfully published to the required queue, the 'queued' column is updated to reflect this.
   * If the update to the queue column fails then the message is not published and is left to be re-published by the
   * background job RepublishMessage.
   * @param publishData The content of the message to send
   * @param objectId The id of the data record in the source database
   * @param publication {RascalPublications} The Rascal publication (aka queue) to send the message to
   * @param DB {sequelize: Sequelize, model: SafeRmqPublishSupported} An object containing a sequelize connection/object
   *  and the sequelize model static which contains the objectId.
   */
  public async safePublish(
    publishData: TRmqMessages,
    objectId: number | string,
    publication: RascalPublications,
    DB: { sequelize: Sequelize; model: SafeRmqPublishSupported },
  ) {
    if (!this._initialized) {
      throw new RabbitMQControllerError(
        'RabbitMQController is not initialized!',
      );
    }

    try {
      await DB.sequelize.transaction(async (t) => {
        // yes I know this is ugly/bad, but I have yet to find a workaround to TS2349 when <any> is not applied.
        // We don't get types on the model anyway but at least this way the model above is typed to facilitate calling
        // this 'safPublish' function (arguably more important to ensure this function is not used with incompatible
        // models).
        await (<any>DB.model).update(
          {
            queued: -1,
          },
          {
            where: {
              id: objectId,
            },
            transaction: t,
          },
        );
        await this.publish(publishData, publication);
      });
    } catch (e) {
      if (e instanceof RabbitMQControllerError) {
        this._log.error(
          `RepublishMessages job failure for message: ${JSON.stringify(
            publishData,
          )} to ${publication}.`,
          e,
        );
        // if this fails once not much damage is done since the message is re-queued later again anyway
        (<any>await DB.model).increment('queued', { where: { id: objectId } });
        this.rollbar?.warn(
          `RepublishMessages job failure for message: ${JSON.stringify(
            publishData,
          )} to ${publication}.`,
          e,
        );
      } else {
        this._log.error(
          `Sequelize error occurred while setting queued to -1 for ${DB.model.getTableName()} with id: ${objectId}`,
          e,
        );
        this.rollbar?.warn(
          `Sequelize error occurred while setting queued to -1 for ${DB.model.getTableName()} with id: ${objectId}`,
          e,
        );
      }
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
