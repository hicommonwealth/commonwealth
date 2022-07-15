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
const Title = (kind, chain) => {
    switch (kind) {
        case types_1.EventKind.ProposalCanceled: {
            return {
                title: 'Proposal cancelled',
                description: 'A proposal has been cancelled.',
            };
        }
        case types_1.EventKind.ProposalCreated: {
            return {
                title: 'Proposal created',
                description: 'A proposal has been created.',
            };
        }
        case types_1.EventKind.ProposalExecuted: {
            return {
                title: 'Proposal executed',
                description: 'A proposal has been executed.',
            };
        }
        case types_1.EventKind.ProposalQueued: {
            return {
                title: 'Proposal queued',
                description: 'A proposal has been added to the queue.',
            };
        }
        case types_1.EventKind.VoteEmitted: {
            return {
                title: 'Vote emitted',
                description: 'A new vote has been emitted.',
            };
        }
        case types_1.EventKind.DelegateChanged: {
            return {
                title: 'Delegate changed',
                description: "A user's delegate has been changed.",
            };
        }
        case types_1.EventKind.DelegatedPowerChanged: {
            return {
                title: 'Delegated power changed',
                description: "A user's delegation power has been changed.",
            };
        }
        case types_1.EventKind.Transfer: {
            return {
                title: 'Token Transfer',
                description: 'A user transfers tokens.',
            };
        }
        case types_1.EventKind.Approval: {
            return {
                title: 'Token Approval',
                description: 'A user approves a token spend.',
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = kind;
            throw new Error(`[${interfaces_1.SupportedNetwork.Aave}${chain ? `::${chain}` : ''}]: Unknown event type`);
        }
    }
};
exports.Title = Title;
//# sourceMappingURL=titler.js.map