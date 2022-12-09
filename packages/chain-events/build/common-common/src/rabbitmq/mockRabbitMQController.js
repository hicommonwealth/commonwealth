"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRabbitMQController = void 0;
const rabbitMQController_1 = require("./rabbitMQController");
/**
 * This is a mock RabbitMQController whose functions simply log a 'success' message when called. Used mainly for
 * testing and scripts that need to use eventHandlers without a live RabbitMQ instance.
 */
class MockRabbitMQController extends rabbitMQController_1.RabbitMQController {
    constructor(_rabbitMQConfig) {
        super(_rabbitMQConfig);
    }
    async init() {
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
            throw new rabbitMQController_1.RabbitMQControllerError("RabbitMQController is not initialized!");
        }
        console.log("Subscription started");
        return;
    }
    async publish(data, publisherName) {
        if (!this._initialized) {
            throw new rabbitMQController_1.RabbitMQControllerError("RabbitMQController is not initialized!");
        }
        console.log("Message published");
    }
    get initialized() {
        return this._initialized;
    }
}
exports.MockRabbitMQController = MockRabbitMQController;
