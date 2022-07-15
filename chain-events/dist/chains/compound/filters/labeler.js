"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
const Label = (blockNumber, chainId, data, chain) => {
    switch (data.kind) {
        case types_1.EventKind.ProposalCanceled: {
            return {
                heading: 'Proposal Canceled',
                label: `Proposal ${data.id} was cancelled.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/compoundproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalCreated: {
            return {
                heading: 'Proposal Created',
                label: `Proposal ${data.id} was created.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/compoundproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalExecuted: {
            return {
                heading: 'Proposal Executed',
                label: `Proposal ${data.id} was executed.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/compoundproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalQueued: {
            return {
                heading: 'Proposal Queued',
                label: `Proposal ${data.id} queued up. ETA: Block ${data.eta}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/compoundproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.VoteCast: {
            return {
                heading: 'Vote Cast',
                label: `Voter (${data.voter}) cast ${data.votes} votes ${data.support ? 'not' : null} in support of proposal ${data.id}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/compoundproposal/${data.id}`
                    : null,
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.Compound}${chain ? `::${chain}` : ''}]: Unknown event type`);
        }
    }
};
exports.Label = Label;
//# sourceMappingURL=labeler.js.map