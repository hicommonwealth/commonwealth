"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RmqEntityCUD = void 0;
const index_1 = require("./index");
exports.RmqEntityCUD = {
    getInvalidFormatError(entity) {
        return new index_1.RmqMsgFormatError(`The following entity is improperly formatted: ${JSON.stringify(entity)}`);
    },
    isValidMsgFormat(data) {
        return !!(typeof data.ce_id === 'number'
            && data.chain_id && typeof data.chain_id === 'string'
            && data.cud === 'create');
    },
    checkMsgFormat(data) {
        const valid = this.isValidMsgFormat(data);
        if (!valid) {
            console.log(`The following entity is improperly formatted: ${JSON.stringify(data)}`);
            throw this.getInvalidFormatError(data);
        }
    }
};
