"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChainEventConsumer = void 0;
const ServiceConsumer_1 = require("../../../common-common/src/ServiceConsumer");
const storage_1 = __importDefault(require("./ChainEventHandlers/storage"));
const notification_1 = __importDefault(require("./ChainEventHandlers/notification"));
const entityArchival_1 = __importDefault(require("./ChainEventHandlers/entityArchival"));
const logging_1 = require("../../../common-common/src/logging");
const rabbitmq_1 = require("../../../common-common/src/rabbitmq");
const database_1 = __importDefault(require("../database/database"));
const config_1 = require("../config");
const ChainEventsQueue_1 = require("./MessageProcessors/ChainEventsQueue");
const src_1 = require("../../src");
const rollbar_1 = __importDefault(require("rollbar"));
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
/**
 * This functions initializes a single RabbitMQController instance and then subscribes to ChainCUD messages coming
 * from the {@link RascalSubscriptions.ChainEvents}
 * subscriptions. The function also runs RepublishMessages which periodically republishes data stored in the database
 * that was previously unsuccessfully published.
 */
async function setupChainEventConsumer() {
    let rollbar;
    if (config_1.ROLLBAR_SERVER_TOKEN) {
        rollbar = new rollbar_1.default({
            accessToken: config_1.ROLLBAR_SERVER_TOKEN,
            environment: process.env.NODE_ENV,
            captureUncaught: true,
            captureUnhandledRejections: true,
        });
    }
    let rmqController;
    try {
        rmqController = new rabbitmq_1.RabbitMQController((0, rabbitmq_1.getRabbitMQConfig)(config_1.RABBITMQ_URI), rollbar);
        await rmqController.init();
    }
    catch (e) {
        log.error('Rascal consumer setup failed. Please check the Rascal configuration');
        throw e;
    }
    // writes events into the db as ChainEvents rows
    const storageHandler = new storage_1.default(database_1.default, rmqController);
    // creates and updates ChainEntity rows corresponding with entity-related events
    const entityArchivalHandler = new entityArchival_1.default(database_1.default, rmqController);
    const excludedNotificationEvents = [src_1.SubstrateTypes.EventKind.DemocracyTabled];
    const notificationsHandler = new notification_1.default(database_1.default, rmqController, excludedNotificationEvents);
    // WARNING: due to dbEvent in each handler ORDER OF HANDLERS MATTERS!
    const allChainEventHandlers = [
        storageHandler,
        notificationsHandler,
        entityArchivalHandler,
    ];
    // setup Chain
    const chainEventsProcessorContext = {
        allChainEventHandlers,
        log,
    };
    const chainEventsProcessorRmqSub = {
        messageProcessor: ChainEventsQueue_1.processChainEvents,
        subscriptionName: rabbitmq_1.RascalSubscriptions.ChainEvents,
        msgProcessorContext: chainEventsProcessorContext,
    };
    let subscriptions = [chainEventsProcessorRmqSub];
    const serviceConsumer = new ServiceConsumer_1.ServiceConsumer('ChainEventsConsumer', rmqController, subscriptions);
    await serviceConsumer.init();
    // TODO: turn this on if needed later - leaving off for now as it may not produce an optimal retrying strategy
    //  and can dilute the retry message data/stats we get on datadog
    // const republishMessages = new RepublishMessages(rmqController, models);
    // await republishMessages.run();
    log.info('Consumer started');
    return serviceConsumer;
}
exports.setupChainEventConsumer = setupChainEventConsumer;
/**
 * Entry point for the ChainEventsConsumer server
 */
async function main() {
    try {
        log.info('Starting consumer...');
        await setupChainEventConsumer();
    }
    catch (error) {
        log.fatal('Consumer setup failed', error);
    }
}
if (process.argv[2] === 'run-as-script')
    main();
