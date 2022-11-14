"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RmqCWEvent = void 0;
const rabbitmq_1 = require("common-common/src/rabbitmq");
/**
 * This class is merged with the namespace with the same name below so that within one object we have the invalid
 * format error, the function to check the format, and the type itself
 */
exports.RmqCWEvent = {
    getInvalidFormatError(event) {
        return new rabbitmq_1.RmqMsgFormatError(`The following CW event is improperly formatted: ${JSON.stringify(event)}`);
    },
    isValidMsgFormat(data) {
        return (typeof data.blockNumber === 'number'
            && data.data
            && data.network
            && typeof data.network === 'string');
    }
};
