"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RmqCETypeCUD = void 0;
const index_1 = require("./index");
exports.RmqCETypeCUD = {
    getInvalidFormatError(chainEventType) {
        return new index_1.RmqMsgFormatError(`The following chain-event-type is improperly formatted: ${JSON.stringify(chainEventType)}`);
    },
    isValidMsgFormat(data) {
        return !!(data.chainEventTypeId && typeof data.chainEventTypeId === 'string'
            && data.cud === 'create');
    },
    checkMsgFormat(data) {
        const valid = this.isValidMsgFormat(data);
        if (!valid) {
            console.log(`The following chain-event-type is improperly formatted: ${JSON.stringify(data)}`);
            throw this.getInvalidFormatError(data);
        }
    }
};
