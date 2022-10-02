import * as Rascal from 'rascal';
import {factory, formatFilename} from 'common-common/src/logging';
import {RascalPublications, RascalSubscriptions, RmqMsgFormatError, rmqMsgToName, TRmqMessages} from "./types";
import {Sequelize} from "sequelize";
import {ChainEntityModelStatic} from "chain-events/services/database/models/chain_entity";
import {ChainEventModelStatic} from "chain-events/services/database/models/chain_event";
import {ChainEventTypeModelStatic} from "chain-events/services/database/models/chain_event_type";
import {ChainModelStatic} from "commonwealth/server/models/chain";

const log = factory.getLogger(formatFilename(__filename));

// TODO: enforce/check/use?
export type SafeRmqPublishSupported =
  ChainEntityModelStatic
  | ChainEventModelStatic
  | ChainEventTypeModelStatic
  | ChainModelStatic;

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
        // TODO: fix error handling - to test run the chain-events subscriber + consumer and then run the main service
        //  consumer. To test an 'error' change isRmqMsgCreateCENotificationsCUD ChainEvent.id to be 'string' instead of 'number'
        messageProcessor.call({rmqController: this, ...msgProcessorContext}, content).catch((e) => {
          // if the message processor throws because of a message formatting error then we immediately deadLetter the
          // message to avoid re-queuing the message multiple times
          if (e instanceof RmqMsgFormatError) ackOrNack(e, {strategy: 'nack'});
          ackOrNack(e, [{strategy: 'republish', defer: 2000, attempts: 3}, {strategy: 'nack'}]);
        })
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
      throw new RabbitMQControllerError(`${err.message}`);
    }
    return subscription;
  }

  // TODO: add a class property that takes an object from publisherName => callback function
  //      if a message is successfully published to a particular queue then the callback is executed

  // TODO: the publish ACK should be in a transaction with the publish itself
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
        throw new PublishError(err.message);
      });
    } catch (err) {
      if (err instanceof PublishError) throw err;
      else throw new RabbitMQControllerError(`Rascal config error: ${err.message}`)
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
    DB: { sequelize: Sequelize, model: SafeRmqPublishSupported }
  ) {
    const modelName = rmqMsgToName(publishData);
    try {
      await DB.sequelize.transaction(async (t) => {
        // yes I know this is ugly/bad, but I have yet to find a workaround to TS2349 when <any> is not applied.
        // We don't get types on the model anyway but at least this way the model above is typed to facilitate calling
        // this 'safPublish' function (arguably more important to ensure this function is not used with incompatible
        // models).
       (<any>(await DB.model)).update({
          queued: -1
        }, {
          where: {
            id: objectId
          }
        });
        await this.publish(publishData, publication);
      });
    } catch (e) {
      if (e instanceof RabbitMQControllerError) {
        log.error(`RepublishMessages job failure for message: ${JSON.stringify(publishData)} to ${publication}.`, e);
        // if this fails once not much damage is done since the message is re-queued later again anyway
        (<any>(await DB.model)).increment("queued", {where: {id: objectId}});
      } else {
        log.error(`Sequelize error occurred while setting queued to -1 for ${modelName} with id: ${objectId}`, e)
      }
    }
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
