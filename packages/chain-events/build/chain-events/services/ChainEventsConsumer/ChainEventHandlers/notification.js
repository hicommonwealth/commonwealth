"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const types_1 = require("../../../../common-common/src/rabbitmq/types");
const logging_1 = require("../../../src/logging");
class default_1 extends src_1.IEventHandler {
    _models;
    _rmqController;
    _excludedEvents;
    name = 'Notification Producer';
    constructor(_models, _rmqController, _excludedEvents = []) {
        super();
        this._models = _models;
        this._rmqController = _rmqController;
        this._excludedEvents = _excludedEvents;
    }
    async handle(event, dbEvent) {
        const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [event.network, event.chain]));
        if (!dbEvent) {
            log.trace(`No db event received! Ignoring.`);
            return;
        }
        if (this._excludedEvents.includes(event.data.kind)) {
            log.trace(`Skipping event!`);
            return dbEvent;
        }
        let dbEventType;
        try {
            dbEventType = await dbEvent.getChainEventType();
            if (!dbEventType) {
                log.error(`Failed to fetch event type! Ignoring.`);
                return;
            }
        }
        catch (e) {
            log.error(`Failed to get chain-event type for event: ${JSON.stringify(event)}`);
            return dbEvent;
        }
        const formattedEvent = dbEvent.toJSON();
        formattedEvent.ChainEventType = dbEventType.toJSON();
        const publishData = {
            ChainEvent: formattedEvent,
            event,
            cud: 'create',
        };
        await this._rmqController.safePublish(publishData, dbEvent.id, types_1.RascalPublications.ChainEventNotificationsCUDMain, {
            sequelize: this._models.sequelize,
            model: this._models.ChainEvent,
        });
        log.info('Chain-event Notification sent to CUD queue.');
        return dbEvent;
    }
}
exports.default = default_1;
