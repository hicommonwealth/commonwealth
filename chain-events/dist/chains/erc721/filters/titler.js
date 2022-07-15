"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Title = void 0;
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
const Title = (kind) => {
    switch (kind) {
        case types_1.EventKind.Approval:
            return {
                title: 'Delegation Approved',
                description: 'One account delegated a token to another.',
            };
        case types_1.EventKind.ApprovalForAll:
            return {
                title: 'Full Delegation Approved',
                description: 'One account delegated all of its tokens to another.',
            };
        case types_1.EventKind.Transfer:
            return {
                title: 'Tokens Transferred',
                description: 'Tokens have been transferred.',
            };
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = kind;
            throw new Error(`[${interfaces_1.SupportedNetwork.ERC721}]: Unknown event type: ${kind}`);
        }
    }
};
exports.Title = Title;
//# sourceMappingURL=titler.js.map