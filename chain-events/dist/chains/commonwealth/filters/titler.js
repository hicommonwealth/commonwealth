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
        case types_1.EventKind.ProjectCreated: {
            return {
                title: 'Project created',
                description: 'A new project has been created.',
            };
        }
        case types_1.EventKind.ProjectBacked: {
            return {
                title: 'Project backed',
                description: 'A project has been backed.',
            };
        }
        case types_1.EventKind.ProjectCurated: {
            return {
                title: 'Project curated',
                description: 'A project has been curated.',
            };
        }
        case types_1.EventKind.ProjectSucceeded: {
            return {
                title: 'Project succeeded',
                description: 'A project succeeds at meeting funding threshold.',
            };
        }
        case types_1.EventKind.ProjectFailed: {
            return {
                title: 'Project failed',
                description: 'A project fails to meet funding threshold.',
            };
        }
        case types_1.EventKind.ProjectWithdraw: {
            return {
                title: 'Project withdraw',
                description: 'A project has been withdrawn from.',
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = kind;
            throw new Error(`[${interfaces_1.SupportedNetwork.Commonwealth}${chain ? `::${chain}` : ''}]: Unknown event type`);
        }
    }
};
exports.Title = Title;
//# sourceMappingURL=titler.js.map