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
const Label = (blockNumber, chainId, data, chain) => {
    switch (data.kind) {
        // TODO: snag link URLs from Created
        // TODO: improve these
        case types_1.EventKind.ProjectCreated: {
            return {
                heading: 'Project Created',
                label: `Project "${data.name}" was created.`,
            };
        }
        case types_1.EventKind.ProjectBacked: {
            return {
                heading: 'Project Backed',
                label: `Project backed by ${fmtAddr(data.sender)}.`,
            };
        }
        case types_1.EventKind.ProjectCurated: {
            return {
                heading: 'Project Curated',
                label: `Project curated by ${fmtAddr(data.sender)}.`,
            };
        }
        case types_1.EventKind.ProjectSucceeded: {
            return {
                heading: 'Project Succeeded',
                label: `Project ${fmtAddr(data.id)} succeeded!.`,
            };
        }
        case types_1.EventKind.ProjectFailed: {
            return {
                heading: 'Project Failed',
                label: `Project ${fmtAddr(data.id)} failed.`,
            };
        }
        case types_1.EventKind.ProjectWithdraw: {
            return {
                heading: 'Project Withdraw',
                label: `Project withdrawal by ${fmtAddr(data.sender)}, for reason: "${data.withdrawalType}"`,
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.Commonwealth}${chain ? `::${chain}` : ''}]: Unknown event type!`);
        }
    }
};
exports.Label = Label;
//# sourceMappingURL=labeler.js.map