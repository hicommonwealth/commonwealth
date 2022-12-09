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
        case types_1.EventKind.SubmitProposal:
            return {
                title: 'Proposal Submitted',
                description: 'A user submits a  proposal.',
            };
        case types_1.EventKind.Deposit:
            return {
                title: 'Deposit',
                description: 'A deposit is made on a proposal.',
            };
        case types_1.EventKind.Vote:
            return {
                title: 'Vote',
                description: 'A vote is made on a proposal.',
            };
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = kind;
            throw new Error(`[${interfaces_1.SupportedNetwork.Cosmos}]: Unknown event type: ${kind}`);
        }
    }
};
exports.Title = Title;
