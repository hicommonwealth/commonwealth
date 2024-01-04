'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.RabbitMQController = exports.RabbitMQControllerError = void 0;
const Rascal = __importStar(require('rascal'));
const types_1 = require('./types');
const logging_1 = require('common-common/src/logging');
const log = logging_1.factory.getLogger(
  (0, logging_1.formatFilename)(__filename),
);
class RabbitMQControllerError extends Error {
  constructor(msg) {
    super(msg);
    Object.setPrototypeOf(this, RabbitMQControllerError.prototype);
  }
}
exports.RabbitMQControllerError = RabbitMQControllerError;
class PublishError extends RabbitMQControllerError {
  constructor(msg) {
    super(`Error publishing. ${msg}`);
    Object.setPrototypeOf(this, PublishError.prototype);
  }
}
/**
 * This class encapsulates all interactions with a RabbitMQ instance. It allows publishing and subscribing to queues. To
 * initialize the class you must have a Rascal configuration. Every publish and message processing should be done
 * through this class as it implements error handling that is crucial to avoid data loss.
 */
class RabbitMQController extends types_1.AbstractRabbitMQController {
  _rabbitMQConfig;
  broker;
  subscribers;
  publishers;
  _rawVhost;
  rollbar;
  constructor(_rabbitMQConfig, rollbar) {
    super();
    this._rabbitMQConfig = _rabbitMQConfig;
    // sets the first vhost config to _rawVhost
    this._rawVhost =
      _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];
    // array of subscribers
    this.subscribers = Object.keys(this._rawVhost.subscriptions);
    // array of publishers
    this.publishers = Object.keys(this._rawVhost.publications);
    this.rollbar = rollbar;
  }
  async init() {
    log.info(`Rascal connecting to RabbitMQ: ${this._rawVhost.connection}`);
    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig),
    );
    this.broker.on('error', (err, { vhost, connectionUrl }) => {
      log.error(
        `Broker error on vhost: ${vhost} using url: ${connectionUrl}`,
        err,
      );
    });
    this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
      log.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`,
      );
    });
    this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
      log.warn(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`,
      );
    });
    this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
      log.info(
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
  async startSubscription(
    messageProcessor,
    subscriptionName,
    msgProcessorContext,
  ) {
    if (!this._initialized) {
      throw new RabbitMQControllerError(
        'RabbitMQController is not initialized!',
      );
    }
    let subscription;
    if (!this.subscribers.includes(subscriptionName))
      throw new RabbitMQControllerError('Subscription does not exist');
    try {
      log.info(`Subscribing to ${subscriptionName}`);
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
            if (e instanceof types_1.RmqMsgFormatError) {
              log.error(`Invalid Message Format Error - ${errorMsg}`, e);
              this.rollbar?.warn(`Invalid Message Format - ${errorMsg}`, e);
              ackOrNack(e, { strategy: 'nack' });
            } else {
              log.error(`Unknown Error - ${errorMsg}`, e);
              this.rollbar?.warn(`Unknown Error - ${errorMsg}`, e);
              ackOrNack(e, [
                { strategy: 'republish', defer: 2000, attempts: 3 },
                { strategy: 'nack' },
              ]);
            }
          });
      });
      subscription.on('error', (err) => {
        log.error(`Subscriber error: ${err}`);
        this.rollbar?.warn(`Subscriber error: ${err}`);
      });
      subscription.on('invalid_content', (err, message, ackOrNack) => {
        log.error(`Invalid content`, err);
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
  async publish(data, publisherName) {
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
        log.error(`Publisher error ${messageId}`, err);
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
  async safePublish(publishData, objectId, publication, DB) {
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
        await DB.model.update(
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
        log.error(
          `RepublishMessages job failure for message: ${JSON.stringify(
            publishData,
          )} to ${publication}.`,
          e,
        );
        // if this fails once not much damage is done since the message is re-queued later again anyway
        (await DB.model).increment('queued', { where: { id: objectId } });
        this.rollbar?.warn(
          `RepublishMessages job failure for message: ${JSON.stringify(
            publishData,
          )} to ${publication}.`,
          e,
        );
      } else {
        log.error(
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
  async shutdown() {
    await this.broker.shutdown();
    this._initialized = false;
  }
  get initialized() {
    return this._initialized;
  }
}
exports.RabbitMQController = RabbitMQController;
