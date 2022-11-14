"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RmqCENotification = void 0;
const rabbitmq_1 = require("common-common/src/rabbitmq");
const moment_1 = __importDefault(require("moment/moment"));
exports.RmqCENotification = {
    getInvalidFormatError(notification) {
        return new rabbitmq_1.RmqMsgFormatError(`The following notification is improperly formatted: ${JSON.stringify(notification)}`);
    },
    isValidMsgFormat(data) {
        return (data.id && typeof data.id === 'string'
            && data.notification_data && typeof data.notification_data === 'string'
            && data.chain_event_id && typeof data.chain_event_id === 'string'
            && data.category_id === 'chain-event'
            && data.chain_id && typeof data.chain_id === 'string'
            && moment_1.default.isMoment(data.updated_at)
            && moment_1.default.isMoment(data.created_at)
            && data.ChainEvent
            && typeof data.ChainEvent.chain_event_type_id === 'string'
            && typeof data.ChainEvent.block_number === 'string');
    }
};
