"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceConsumer = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logging_1 = require("./logging");
/**
 * This class is a general wrapper around RabbitMQ functionality. It initializes a RabbitMQ Controller and all the
 * subscriptions that are passed. The subscriptions are held as state within the class, leaving room for future work
 * to get insight into active subscriptions or for managing the currently active subscriptions. The class also
 * initializes a logger instance with a prefix that helps identify exactly where the log came from in a multi-server
 * architecture.
 */
class ServiceConsumer {
    serviceName;
    serviceId;
    rabbitMQController;
    subscriptions;
    _initialized = false;
    rollbar;
    log;
    constructor(_serviceName, _rabbitmqController, _subscriptions, rollbar) {
        this.serviceName = _serviceName;
        // TODO: make this deterministic somehow
        this.serviceId = crypto_1.default.randomBytes(10).toString('hex');
        this.subscriptions = _subscriptions;
        // setup logger
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)((0, logging_1.formatFilename)(__filename), [this.serviceName, this.serviceId]));
        this.rabbitMQController = _rabbitmqController;
        this.rollbar = rollbar;
    }
    async init() {
        this.log.info(`Initializing service-consumer: ${this.serviceName}-${this.serviceId}`);
        if (!this.rabbitMQController.initialized) {
            try {
                await this.rabbitMQController.init();
            }
            catch (e) {
                this.log.error('Failed to initialize the RabbitMQ Controller', e);
                this.rollbar?.error('Failed to initialize the RabbitMQ Controller', e);
            }
        }
        // start all the subscriptions for this consumer
        for (const sub of this.subscriptions) {
            try {
                await this.rabbitMQController.startSubscription(sub.messageProcessor, sub.subscriptionName, sub.msgProcessorContext);
            }
            catch (e) {
                this.log.error(`Failed to start the '${sub.subscriptionName}' subscription with the '${sub.messageProcessor.name}' `
                    + `processor function using context: ${JSON.stringify(sub.msgProcessorContext)}`, e);
                this.rollbar?.critical(`Failed to start the '${sub.subscriptionName}' subscription with the '${sub.messageProcessor.name}' `
                    + `processor function using context: ${JSON.stringify(sub.msgProcessorContext)}`, e);
            }
        }
        this._initialized = true;
    }
    async shutdown() {
        this.log.info(`Service Consumer ${this.serviceName}:${this.serviceId} shutting down...`);
        if (this.rabbitMQController.initialized) {
            this.log.info('Attempting to shutdown RabbitMQ Broker...');
            await this.rabbitMQController.shutdown();
        }
        // any other future clean-up + logging
        this._initialized = false;
        this.log.info(`Service Consumer ${this.serviceName}:${this.serviceId} shut down successful`);
    }
    get initialized() {
        return this._initialized;
    }
}
exports.ServiceConsumer = ServiceConsumer;
