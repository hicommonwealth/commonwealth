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
        case types_1.EventKind.SubmitProposal:
            return {
                title: 'Proposal Submitted',
                description: 'A new proposal is submitted.',
            };
        case types_1.EventKind.SubmitVote:
            return {
                title: 'Vote Submitted',
                description: 'A proposal is voted on.',
            };
        case types_1.EventKind.ProcessProposal:
            return {
                title: 'Proposal Processed',
                description: 'A proposal is completed and processed.',
            };
        case types_1.EventKind.Ragequit:
            return {
                title: 'Member Ragequit',
                description: 'A member ragequits.',
            };
        case types_1.EventKind.Abort:
            return {
                title: 'Proposal Aborted',
                description: 'A proposal is aborted by its applicant.',
            };
        case types_1.EventKind.UpdateDelegateKey:
            return {
                title: 'Delegate Key Updated',
                description: 'A member updates their delegate key.',
            };
        case types_1.EventKind.SummonComplete:
            return {
                title: 'Summon Complete',
                description: 'The contract is summoned (never emitted).',
            };
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = kind;
            throw new Error(`[${interfaces_1.SupportedNetwork.Moloch}${chain ? `::${chain}` : ''}]: Unknown event type`);
        }
    }
};
exports.Title = Title;
//# sourceMappingURL=titler.js.map