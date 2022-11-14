"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQController = exports.RabbitMQControllerError = void 0;
const Rascal = __importStar(require("rascal"));
const logging_1 = require("common-common/src/logging");
const types_1 = require("./types");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
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
class RabbitMQController {
    _rabbitMQConfig;
    broker;
    subscribers;
    publishers;
    _rawVhost;
    _initialized = false;
    rollbar;
    constructor(_rabbitMQConfig, rollbar) {
        this._rabbitMQConfig = _rabbitMQConfig;
        // sets the first vhost config to _rawVhost
        this._rawVhost = _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];
        // array of subscribers
        this.subscribers = Object.keys(this._rawVhost.subscriptions);
        // array of publishers
        this.publishers = Object.keys(this._rawVhost.publications);
        this.rollbar = rollbar;
    }
    async init() {
        log.info(`Rascal connecting to RabbitMQ: ${this._rawVhost.connection}`);
        this.broker = await Rascal.BrokerAsPromised.create(Rascal.withDefaultConfig(this._rabbitMQConfig));
        this.broker.on('error', (err, { vhost, connectionUrl }) => {
            log.error(`Broker error on vhost: ${vhost} using url: ${connectionUrl}`, err);
        });
        this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
            log.info(`Vhost: ${vhost} was initialised using connection: ${connectionUrl}`);
        });
        this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
            log.warn(`Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`);
        });
        this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
            log.info(`Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`);
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
    async startSubscription(messageProcessor, subscriptionName, msgProcessorContext) {
        if (!this._initialized) {
            throw new RabbitMQControllerError("RabbitMQController is not initialized!");
        }
        let subscription;
        if (!this.subscribers.includes(subscriptionName))
            throw new RabbitMQControllerError('Subscription does not exist');
        try {
            log.info(`Subscribing to ${subscriptionName}`);
            subscription = await this.broker.subscribe(subscriptionName);
            subscription.on('message', (message, content, ackOrNack) => {
                messageProcessor.call({ rmqController: this, ...msgProcessorContext }, content)
                    .then(() => {
                    console.log("Message Acked");
                    ackOrNack();
                })
                    .catch((e) => {
                    const errorMsg = `
            Failed to process message: ${JSON.stringify(content)} 
            with processor function ${messageProcessor.name} and context 
            ${JSON.stringify(msgProcessorContext)}
            `;
                    // if the message processor throws because of a message formatting error then we immediately deadLetter the
                    // message to avoid re-queuing the message multiple times
                    if (e instanceof types_1.RmqMsgFormatError) {
                        log.error(`Invalid Message Format Error - ${errorMsg}`, e);
                        this.rollbar?.warn(`Invalid Message Format - ${errorMsg}`, e);
                        ackOrNack(e, { strategy: 'nack' });
                    }
                    else {
                        log.error(`Unknown Error - ${errorMsg}`, e);
                        this.rollbar?.warn(`Unknown Error - ${errorMsg}`, e);
                        ackOrNack(e, [{ strategy: 'republish', defer: 2000, attempts: 3 }, { strategy: 'nack' }]);
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
        }
        catch (err) {
            throw new RabbitMQControllerError(`${err.message}`);
        }
        return subscription;
    }
    // TODO: add a class property that takes an object from publisherName => callback function
    //      if a message is successfully published to a particular queue then the callback is executed
    async publish(data, publisherName) {
        if (!this._initialized) {
            throw new RabbitMQControllerError("RabbitMQController is not initialized!");
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
        }
        catch (err) {
            if (err instanceof PublishError)
                throw err;
            else
                throw new RabbitMQControllerError(`Rascal config error: ${err.message}`);
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
