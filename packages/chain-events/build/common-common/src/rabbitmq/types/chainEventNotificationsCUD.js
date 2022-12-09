"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RmqCENotificationCUD = void 0;
const src_1 = require("../../../../chain-events/src");
const index_1 = require("./index");
exports.RmqCENotificationCUD = {
    getInvalidFormatError(notification) {
        return new index_1.RmqMsgFormatError(`The following notification is improperly formatted: ${JSON.stringify(notification)}`);
    },
    isValidMsgFormat(data) {
        return !!(typeof data.ChainEvent?.id === 'number'
            && data.ChainEvent.chain_event_type_id && typeof data.ChainEvent.chain_event_type_id === 'string'
            && typeof data.ChainEvent.block_number === 'number'
            && data.ChainEvent.event_data
            && typeof data.event.blockNumber === 'number'
            && data.event.data
            && Object.values(src_1.SupportedNetwork).includes(data.event.network)
            && data.cud === 'create'
            && data.ChainEvent.ChainEventType
            && data.ChainEvent.ChainEventType.id
            && data.ChainEvent.ChainEventType.chain
            && data.ChainEvent.ChainEventType.event_network
            && data.ChainEvent.ChainEventType.event_name);
    },
    checkMsgFormat(data) {
        const valid = this.isValidMsgFormat(data);
        if (!valid) {
            console.log(`The following notification is improperly formatted: ${JSON.stringify(data)}`);
            throw this.getInvalidFormatError(data);
        }
    }
};
