"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Determines which chain entities each event affects and updates state accordingly.
 */
const src_1 = require("../../../src");
const logging_1 = require("../../../../common-common/src/logging");
const types_1 = require("../../../../common-common/src/rabbitmq/types");
class default_1 extends src_1.IEventHandler {
    _models;
    _rmqController;
    _chain;
    name = 'Entity Archival';
    constructor(_models, _rmqController, _chain) {
        super();
        this._models = _models;
        this._rmqController = _rmqController;
        this._chain = _chain;
    }
    /**
     * Handles an existing ChainEvent by connecting it with an entity, and creating
     * threads as needed.
     *
     * `dbEvent` is the database entry corresponding to the `event`.
     */
    async handle(event, dbEvent) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [event.network, event.chain]));
        // if chain is stored in the event then that will override the class property
        // (allows backwards compatibility between reduced memory consuming chain consumer/handlers and other scripts)
        const chain = event.chain || this._chain;
        if (!dbEvent) {
            log.trace('no db event found!');
            return;
        }
        /* We expect to see 3 types of events:
         * 1. Entity creation events, "new proposal", e.g.
         * 2. Entity modification events, state changes and updates
         * 3. Events unrelated to entities (at least, ones we care about), like staking events
         *
         * We should determine, using the event's type, what action to take, based
         * on whether it is a creation, modification, or unrelated event.
         */
        const createEntityFn = async (type, type_id, author, completed = false) => {
            if (type === src_1.SubstrateTypes.EntityKind.DemocracyPreimage) {
                // we always mark preimages as "completed" -- we have no link between democracy proposals
                // and preimages in the database, so we want to always fetch them for archival purposes,
                // which requires marking them completed.
                completed = true;
            }
            const dbEntity = await this._models.ChainEntity.create({
                type: type.toString(),
                type_id,
                chain,
                author,
                completed,
            });
            const publishData = {
                ce_id: dbEntity.id,
                chain_id: dbEntity.chain,
                cud: 'create',
            };
            await this._rmqController.safePublish(publishData, dbEntity.id, types_1.RascalPublications.ChainEntityCUDMain, {
                sequelize: this._models.sequelize,
                model: this._models.ChainEntity,
            });
            if (dbEvent.entity_id !== dbEntity.id) {
                dbEvent.entity_id = dbEntity.id;
                await dbEvent.save();
            }
            else {
                log.info(`Db Event is already linked to entity! Doing nothing.`);
            }
            return dbEvent;
        };
        const updateEntityFn = async (type, type_id, completed = false) => {
            const dbEntity = await this._models.ChainEntity.findOne({
                where: {
                    type: type.toString(),
                    type_id,
                    chain,
                },
            });
            if (!dbEntity) {
                log.error(`no relevant db entity found for ${type}: ${type_id}`);
                return;
            }
            log.info(`Updated db entity, ${type}: ${type_id}.`);
            // link ChainEvent to entity
            dbEvent.entity_id = dbEntity.id;
            await dbEvent.save();
            // update completed state if necessary
            if (!dbEntity.completed && completed) {
                dbEntity.completed = true;
                await dbEntity.save();
            }
            return dbEvent;
        };
        const entity = (0, src_1.eventToEntity)(event.network, event.data.kind);
        if (!entity) {
            log.trace(`no archival action needed for event of kind ${event.data.kind.toString()}`);
            return dbEvent;
        }
        const [entityKind, updateType] = entity;
        const fieldName = (0, src_1.getUniqueEntityKey)(event.network, entityKind);
        const fieldValue = event.data[fieldName].toString();
        const author = event.data['proposer'];
        let result;
        switch (updateType) {
            case src_1.EntityEventKind.Create: {
                result = await createEntityFn(entityKind, fieldValue, author);
                break;
            }
            case src_1.EntityEventKind.Update:
            case src_1.EntityEventKind.Vote: {
                result = await updateEntityFn(entityKind, fieldValue);
                break;
            }
            case src_1.EntityEventKind.Complete: {
                result = await updateEntityFn(entityKind, fieldValue, true);
                break;
            }
            default: {
                result = null;
                break;
            }
        }
    }
}
exports.default = default_1;
