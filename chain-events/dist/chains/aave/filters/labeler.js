"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const moment_1 = __importDefault(require("moment"));
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
function fmtAddr(addr) {
    if (!addr)
        return '';
    if (addr.length < 16)
        return addr;
    return `${addr.slice(0, 7)}…${addr.slice(addr.length - 3)}`;
}
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
                    ? `/${chainId}/proposal/onchainproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalCreated: {
            return {
                heading: 'Proposal Created',
                label: `Proposal ${data.id} was created.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/onchainproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalExecuted: {
            return {
                heading: 'Proposal Executed',
                label: `Proposal ${data.id} was executed.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/onchainproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalQueued: {
            return {
                heading: 'Proposal Queued',
                label: `Proposal ${data.id} queued up. Execution time: ${moment_1.default
                    .unix(data.executionTime)
                    .format()}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/onchainproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.VoteEmitted: {
            return {
                heading: 'Vote Emitted',
                label: `Voter (${data.voter}) voted with weight ${data.votingPower} ${data.support ? 'against' : 'for'} proposal ${data.id}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/onchainproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.DelegateChanged: {
            return {
                heading: 'Delegate Changed',
                label: `User ${fmtAddr(data.delegator)} delegated to ${fmtAddr(data.delegatee)}.`,
                linkUrl: chainId ? `/${chainId}/account/${data.delegator}` : null,
            };
        }
        case types_1.EventKind.DelegatedPowerChanged: {
            return {
                heading: 'Delegated Power Changed',
                label: `User ${fmtAddr(data.who)} updated their delegation power.`,
                linkUrl: chainId ? `/${chainId}/account/${data.who}` : null,
            };
        }
        case types_1.EventKind.Transfer: {
            return {
                heading: 'Token Transfer',
                label: `Transfer of ${data.amount} tokens from ${data.from} to ${data.to}.`,
            };
        }
        case types_1.EventKind.Approval: {
            return {
                heading: 'Approval',
                label: `${data.spender} approved ${data.amount} to ${data.owner}.`,
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.Aave}${chain ? `::${chain}` : ''}]: Unknown event type!`);
        }
    }
};
exports.Label = Label;
//# sourceMappingURL=labeler.js.map