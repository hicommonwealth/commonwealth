"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RmqSnapshotEvent = void 0;
const rabbitmq_1 = require("common-common/src/rabbitmq");
exports.RmqSnapshotEvent = {
    getInvalidFormatError(event) {
        return new rabbitmq_1.RmqMsgFormatError(`The following snapshot event is improperly formatted: ${JSON.stringify(event)}`);
    },
    isValidMsgFormat(data) {
        return (typeof data.id === 'string'
            && data.event === 'string'
            && data.space === 'string'
            && typeof data.expire === 'number');
    }
};
