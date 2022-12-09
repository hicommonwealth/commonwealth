"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMqHandler = void 0;
const rabbitmq_1 = require("../../../../common-common/src/rabbitmq");
class RabbitMqHandler extends rabbitmq_1.RabbitMQController {
    publication;
    constructor(_rabbitMQConfig, publication) {
        super(_rabbitMQConfig);
        if (!this.publishers.includes(publication))
            throw new Error('Given publication does not exist!');
        this.publication = publication;
    }
    async handle(event) {
        if (!event) {
            return;
        }
        try {
            await this.publish(event, this.publication);
        }
        catch (err) {
            throw new Error(`Rascal config error: ${err.message}`);
        }
    }
}
exports.RabbitMqHandler = RabbitMqHandler;
