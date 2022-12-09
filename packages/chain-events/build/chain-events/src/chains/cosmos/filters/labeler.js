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
    return `${addr.slice(0, 9)}…${addr.slice(addr.length - 3)}`;
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
                label: `Proposal ${data.id} was submitted!`,
                linkUrl: chainId ? `/${chainId}/proposal/${data.id}` : null,
            };
        case types_1.EventKind.Deposit:
            return {
                heading: 'Deposit',
                label: `${fmtAddr(data.depositor)} made a deposit on proposal ${data.id}.`,
                linkUrl: chainId ? `/${chainId}/proposal/${data.id}` : null,
            };
        case types_1.EventKind.Vote:
            return {
                heading: 'Vote',
                label: `${fmtAddr(data.voter)} voted on proposal ${data.id}.`,
                linkUrl: chainId ? `/${chainId}/proposal/${data.id}` : null,
            };
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.Cosmos}::${chainId}]: Unknown event type`);
        }
    }
};
exports.Label = Label;
