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
function ParseType(name, chain) {
    const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Aave, chain]));
    switch (name) {
        case 'ProposalExecuted':
            return types_1.EventKind.ProposalExecuted;
        case 'ProposalCreated':
            return types_1.EventKind.ProposalCreated;
        case 'ProposalCanceled':
            return types_1.EventKind.ProposalCanceled;
        case 'ProposalQueued':
            return types_1.EventKind.ProposalQueued;
        case 'VoteEmitted':
            return types_1.EventKind.VoteEmitted;
        case 'DelegateChanged':
            return types_1.EventKind.DelegateChanged;
        case 'DelegatedPowerChanged':
            return types_1.EventKind.DelegatedPowerChanged;
        case 'Transfer':
            return types_1.EventKind.Transfer;
        case 'Approval':
            return types_1.EventKind.Approval;
        default: {
            log.warn(`Unknown event name: ${name}`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
//# sourceMappingURL=type_parser.js.map