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
        case types_1.EventKind.Approval:
            return {
                heading: 'Approval',
                label: `Owner ${fmtAddr(data.owner)} approved spender ${fmtAddr(data.spender)}
        to spend ${data.value}.`,
            };
        case types_1.EventKind.Transfer:
            return {
                heading: 'Transfer',
                label: `Transfer of ${data.value} on ${chainId} from ${data.from} to ${data.to}.`,
            };
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.ERC20}::${chainId}]: Unknown event type`);
        }
    }
};
exports.Label = Label;
//# sourceMappingURL=labeler.js.map