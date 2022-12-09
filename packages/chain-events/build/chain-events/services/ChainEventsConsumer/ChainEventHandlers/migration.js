"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Processes events during migration, upgrading from simple notifications to entities.
 */
const src_1 = require("../../../src");
const rabbitmq_1 = require("../../../../common-common/src/rabbitmq");
const logging_1 = require("../../../../common-common/src/logging");
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
class default_1 extends src_1.IEventHandler {
    _models;
    _rmqController;
    _chain;
    constructor(_models, _rmqController, _chain) {
        super();
        this._models = _models;
        this._rmqController = _rmqController;
        this._chain = _chain;
    }
    /**
     * Handles an event during the migration process, by creating or updating existing
     * events depending whether we've seen them before.
     */
    async handle(event) {
        const chain = event.chain || this._chain;
        // case by entity type to determine what value to look for
        const createOrUpdateModel = async (fieldName, fieldValue, eventType) => {
            const [dbEventType, created,] = await this._models.ChainEventType.findOrCreate({
                where: {
                    id: `${chain}-${event.data.kind.toString()}`,
                    chain,
                    event_network: event.network,
                    event_name: event.data.kind.toString(),
                },
            });
            log.trace(`${created ? 'created' : 'found'} chain event type: ${dbEventType.id}`);
            if (created) {
                const publishData = {
                    chainEventTypeId: dbEventType.id,
                    cud: 'create',
                };
                await this._rmqController.safePublish(publishData, dbEventType.id, rabbitmq_1.RascalPublications.ChainEventTypeCUDMain, {
                    sequelize: this._models.sequelize,
                    model: this._models.ChainEventType,
                });
            }
            const queryFieldName = `event_data.${fieldName}`;
            const queryArgs = eventType === src_1.EntityEventKind.Vote
                ? {
                    chain_event_type_id: dbEventType.id,
                    [queryFieldName]: fieldValue,
                    // votes will be unique by data rather than by type
                    event_data: event.data,
                }
                : {
                    chain_event_type_id: dbEventType.id,
                    [queryFieldName]: fieldValue,
                };
            const existingEvent = await this._models.ChainEvent.findOne({
                where: queryArgs,
            });
            if (!existingEvent) {
                log.info('No existing event found, creating new event in db!');
                const dbEvent = await this._models.ChainEvent.create({
                    chain_event_type_id: dbEventType.id,
                    block_number: event.blockNumber,
                    event_data: event.data,
                });
                const formattedEvent = dbEvent.toJSON();
                formattedEvent.ChainEventType = dbEventType.toJSON();
                const publishData = {
                    ChainEvent: formattedEvent,
                    event,
                    cud: 'create',
                };
                await this._rmqController.safePublish(publishData, dbEvent.id, rabbitmq_1.RascalPublications.ChainEventNotificationsCUDMain, {
                    sequelize: this._models.sequelize,
                    model: this._models.ChainEvent,
                });
            }
            else {
                existingEvent.event_data = event.data;
                await existingEvent.save();
                log.info('Existing event found and migrated successfully!');
                return existingEvent;
            }
        };
        const entity = (0, src_1.eventToEntity)(event.network, event.data.kind);
        if (!entity)
            return null;
        const [entityKind, eventType] = entity;
        const fieldName = (0, src_1.getUniqueEntityKey)(event.network, entityKind);
        if (!fieldName)
            return null;
        const fieldValue = event.data[fieldName];
        return createOrUpdateModel(fieldName, fieldValue, eventType);
    }
}
exports.default = default_1;
