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
    const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Commonwealth, chain]));
    switch (name) {
        case 'ProjectCreated':
            return types_1.EventKind.ProjectCreated;
        case 'Back':
            return types_1.EventKind.ProjectBacked;
        case 'Curate':
            return types_1.EventKind.ProjectCurated;
        case 'Succeeded':
            return types_1.EventKind.ProjectSucceeded;
        case 'Failed':
            return types_1.EventKind.ProjectFailed;
        case 'Withdraw':
            return types_1.EventKind.ProjectWithdraw;
        default: {
            log.warn(`Unknown event name: ${name}`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
//# sourceMappingURL=type_parser.js.map