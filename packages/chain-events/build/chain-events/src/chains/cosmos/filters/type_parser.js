"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseType = void 0;
const types_1 = require("../types");
const logging_1 = require("../../../logging");
const interfaces_1 = require("../../../interfaces");
/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
function ParseType(typeUrl, chain) {
    const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Cosmos, chain]));
    switch (typeUrl) {
        case '/cosmos.gov.v1beta1.MsgSubmitProposal':
            return types_1.EventKind.SubmitProposal;
        case '/cosmos.gov.v1beta1.MsgVote':
            return types_1.EventKind.Vote;
        case '/cosmos.gov.v1beta1.MsgDeposit':
            return types_1.EventKind.Deposit;
        default: {
            log.trace(`Unknown event typeUrl: ${typeUrl}!`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
