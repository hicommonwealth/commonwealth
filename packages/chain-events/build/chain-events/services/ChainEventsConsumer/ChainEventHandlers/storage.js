"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generic handler that stores the event in the database.
 */
const src_1 = require("../../../src");
const Sequelize = __importStar(require("sequelize"));
const logging_1 = require("../../../../common-common/src/logging");
const rabbitmq_1 = require("../../../../common-common/src/rabbitmq");
const node_cache_1 = __importDefault(require("node-cache"));
const object_hash_1 = __importDefault(require("object-hash"));
const statsd_1 = require("../../../../common-common/src/statsd");
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
const { Op } = Sequelize;
class default_1 extends src_1.IEventHandler {
    _models;
    _rmqController;
    _chain;
    _filterConfig;
    name = 'Storage';
    eventCache;
    ttl = 20;
    constructor(_models, _rmqController, _chain, _filterConfig = {}) {
        super();
        this._models = _models;
        this._rmqController = _rmqController;
        this._chain = _chain;
        this._filterConfig = _filterConfig;
        this.eventCache = new node_cache_1.default({
            stdTTL: this.ttl,
            deleteOnExpire: true,
            useClones: false,
        });
    }
    /**
     * Truncates a preimage with large args into a smaller form, to decrease
     * storage size in the db and size of /bulkEntities fetches.
     */
    truncateEvent(event, maxLength = 64) {
        // only truncate preimages, for now
        if (event.data.kind === src_1.SubstrateTypes.EventKind.PreimageNoted &&
            event.data.preimage) {
            event.data.preimage.args = event.data.preimage.args.map((m) => m.length > maxLength ? `${m.slice(0, maxLength - 1)}…` : m);
        }
        return event;
    }
    async _shouldSkip(event) {
        return !!this._filterConfig.excludedEvents?.includes(event.data.kind);
    }
    /**
     * Handles an event by creating a ChainEvent in the database.
     * NOTE: this may modify the event.
     */
    async handle(event) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [event.network, event.chain]));
        const chain = event.chain || this._chain;
        event = this.truncateEvent(event);
        const shouldSkip = await this._shouldSkip(event);
        if (shouldSkip) {
            log.trace(`Skipping event!`);
            return;
        }
        // locate event type and add event (and event type if needed) to database
        const [dbEventType, created,] = await this._models.ChainEventType.findOrCreate({
            where: {
                id: `${chain}-${event.data.kind.toString()}`,
                chain,
                event_network: event.network,
                event_name: event.data.kind.toString(),
            },
        });
        if (created) {
            const publishData = {
                chainEventTypeId: dbEventType.id,
                cud: 'create',
            };
            await this._rmqController.safePublish(publishData, dbEventType.id, rabbitmq_1.RascalPublications.ChainEventTypeCUDMain, {
                sequelize: this._models.sequelize,
                model: this._models.ChainEventType,
            });
            log.info(`STORAGE HANDLER MESSAGE PUBLISHED`);
        }
        if (!dbEventType) {
            log.error(`unknown event type: ${event.data.kind}`);
            return;
        }
        else {
            if (created) {
                log.info(`Created new ChainEventType: ${dbEventType.id}`);
            }
            else {
                log.trace(`found chain event type: ${dbEventType.id}`);
            }
        }
        const eventData = {
            chain_event_type_id: dbEventType.id,
            block_number: event.blockNumber,
            event_data: event.data,
        };
        // duplicate event check
        const eventKey = (0, object_hash_1.default)(eventData, {
            respectType: false,
        });
        const cachedEvent = this.eventCache.get(eventKey);
        if (!cachedEvent) {
            const dbEvent = await this._models.ChainEvent.create(eventData);
            // populate chainEventType, so we don't need to re-populate it in subsequence handlers
            dbEvent.ChainEventType = dbEventType;
            // no need to save the entire event data since the key is the hash of the data
            this.eventCache.set(eventKey, true);
            const cacheStats = this.eventCache.getStats();
            statsd_1.StatsDController.get().gauge('ce.num-events-cached', cacheStats.keys);
            statsd_1.StatsDController.get().gauge('ce.event-cache-hits', cacheStats.hits);
            statsd_1.StatsDController.get().gauge('ce.event-cache-misses', cacheStats.misses);
            return dbEvent;
        }
        else {
            // refresh ttl for the duplicated event
            this.eventCache.ttl(eventKey, this.ttl);
            const cacheStats = this.eventCache.getStats();
            statsd_1.StatsDController.get().gauge('ce.num-events-cached', cacheStats.keys);
            statsd_1.StatsDController.get().gauge('ce.event-cache-hits', cacheStats.hits);
            statsd_1.StatsDController.get().gauge('ce.event-cache-misses', cacheStats.misses);
            // return nothing so following handlers ignore this event
            return;
        }
    }
}
exports.default = default_1;
