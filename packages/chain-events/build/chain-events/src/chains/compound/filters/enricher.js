"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrich = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const ethers_1 = require("ethers");
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
async function Enrich(api, blockNumber, kind, rawData) {
    switch (kind) {
        case types_1.EventKind.ProposalCanceled: {
            const [id] = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [],
                network: interfaces_1.SupportedNetwork.Compound,
                data: {
                    kind,
                    id: id.toHexString(),
                },
            };
        }
        case types_1.EventKind.ProposalCreated: {
            // workaround to switch description decoding to "bytes" in order to
            // avoid unicode decoding errors involving invalid codepoints
            // to reproduce: try the uniswap governor alpha
            // also works around the "results" field being unqueryable using the TypedEvent
            const result = ethers_1.utils.defaultAbiCoder.decode([
                'uint',
                'address',
                'address[]',
                'uint[]',
                'string[]',
                'bytes[]',
                'uint',
                'uint',
                'bytes',
            ], rawData.data);
            const [id, proposer, targets, values, signatures, calldatas, startBlock, endBlock, descriptionBytes,] = result;
            const description = ethers_1.utils.toUtf8String(descriptionBytes, ethers_1.utils.Utf8ErrorFuncs.ignore);
            return {
                blockNumber,
                excludeAddresses: [proposer],
                network: interfaces_1.SupportedNetwork.Compound,
                data: {
                    kind,
                    id: id.toHexString(),
                    proposer,
                    targets,
                    values: values.map((v) => v.toString()),
                    signatures,
                    calldatas: calldatas.map((c) => ethers_1.utils.hexlify(c)),
                    startBlock: +startBlock,
                    endBlock: +endBlock,
                    description,
                },
            };
        }
        case types_1.EventKind.ProposalExecuted: {
            const [id] = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [],
                network: interfaces_1.SupportedNetwork.Compound,
                data: {
                    kind,
                    id: id.toHexString(),
                },
            };
        }
        case types_1.EventKind.ProposalQueued: {
            const [id, eta] = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [],
                network: interfaces_1.SupportedNetwork.Compound,
                data: {
                    kind,
                    id: id.toHexString(),
                    eta: +eta,
                },
            };
        }
        case types_1.EventKind.VoteCast: {
            const [voter, proposalId, support, votes, reason, // should be undefined in GovAlpha version
            ] = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [voter],
                network: interfaces_1.SupportedNetwork.Compound,
                data: {
                    kind,
                    voter,
                    id: proposalId.toHexString(),
                    support: +support,
                    votes: votes.toString(),
                    reason,
                },
            };
        }
        default: {
            throw new Error(`Unknown event kind: ${kind}`);
        }
    }
}
exports.Enrich = Enrich;
