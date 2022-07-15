"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
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
const Label = (blockNumber, chainId, data) => {
    switch (data.kind) {
        case types_1.EventKind.SubmitProposal:
            return {
                heading: 'Proposal Submitted',
                label: `Member ${fmtAddr(data.member)} submitted proposal with index ${data.proposalIndex}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}`
                    : null,
            };
        case types_1.EventKind.SubmitVote:
            return {
                heading: 'Vote Submitted',
                label: `A vote was received on proposal ${data.proposalIndex}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}`
                    : null,
            };
        case types_1.EventKind.ProcessProposal:
            return {
                heading: 'Proposal Processed',
                label: `Proposal ${data.proposalIndex} was processed.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}`
                    : null,
            };
        case types_1.EventKind.Ragequit:
            return {
                heading: 'Member Ragequit',
                label: `Member ${fmtAddr(data.member)} ragequit and burned ${data.sharesToBurn} shares.`,
                linkUrl: chainId ? `/${chainId}/account/${data.member}` : null,
            };
        case types_1.EventKind.Abort:
            return {
                heading: 'Proposal Aborted',
                label: `Proposal ${data.proposalIndex} was aborted by applicant ${fmtAddr(data.applicant)}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}`
                    : null,
            };
        case types_1.EventKind.UpdateDelegateKey:
            return {
                heading: 'Delegate Key Updated',
                label: `Member ${fmtAddr(data.member)} updated their delegate to ${fmtAddr(data.newDelegateKey)}.`,
                linkUrl: chainId ? `/${chainId}/account/${data.member}` : null,
            };
        // this event should never appear
        case types_1.EventKind.SummonComplete:
            return {
                heading: 'Summon Complete',
                label: `Moloch is summoned, by user ${fmtAddr(data.summoner)} with ${data.shares}!`,
                linkUrl: chainId ? `/${chainId}/account/${data.summoner}` : null,
            };
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.Moloch}::${chainId}]: Unknown event type`);
        }
    }
};
exports.Label = Label;
//# sourceMappingURL=labeler.js.map