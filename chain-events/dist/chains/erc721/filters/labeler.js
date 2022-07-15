"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const ethers_1 = require("ethers");
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
        case types_1.EventKind.Approval: {
            // check to see if owner disapproves all addresses
            let label = '';
            if (!ethers_1.BigNumber.from(data.approved).isZero()) {
                label = `Owner ${fmtAddr(data.owner)} approved ${fmtAddr(data.approved)}
        to transfer token ${data.tokenId}.`;
            }
            else {
                label = `Owner ${fmtAddr(data.owner)} disapproved any address
          previously able to transfer token ${data.tokenId}.`;
            }
            return {
                heading: 'Approval',
                label,
            };
        }
        case types_1.EventKind.ApprovalForAll: {
            // check to see if owner disapproves all addresses
            let label = '';
            if (data.approved) {
                label = `Owner ${fmtAddr(data.owner)} approved operator ${fmtAddr(data.operator)}
        to transfer all of their tokens.`;
            }
            else {
                label = `Owner ${fmtAddr(data.owner)} has disapproved ${fmtAddr(data.operator)}
          from transferring any of their tokens.`;
            }
            return {
                heading: 'Approval For All',
                label,
            };
        }
        case types_1.EventKind.Transfer:
            return {
                heading: 'Transfer',
                label: `Transfer of ${data.tokenId} on ${chainId} from ${data.from} to ${data.to}.`,
            };
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.ERC721}::${chainId}]: Unknown event type`);
        }
    }
};
exports.Label = Label;
//# sourceMappingURL=labeler.js.map