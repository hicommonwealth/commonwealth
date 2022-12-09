"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrich = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const web3_utils_1 = require("web3-utils");
const contractTypes_1 = require("../../../contractTypes");
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
async function Enrich(api, blockNumber, kind, rawData) {
    switch (kind) {
        case types_1.EventKind.ProjectCreated: {
            const { projectIndex, projectAddress } = rawData.args;
            const projectContract = contractTypes_1.ICuratedProject__factory.connect(projectAddress, api.factory.provider);
            const { id, name, ipfsHash, url, creator, } = await projectContract.metaData();
            const { threshold, deadline, beneficiary, acceptedToken, } = await projectContract.projectData();
            const curatorFee = await projectContract.curatorFee();
            const fundingAmount = await projectContract.totalFunding();
            return {
                blockNumber,
                excludeAddresses: [],
                network: interfaces_1.SupportedNetwork.Commonwealth,
                data: {
                    kind,
                    id: projectAddress,
                    index: projectIndex.toString(),
                    name: (0, web3_utils_1.hexToAscii)(name).replace(/\0/g, ''),
                    ipfsHash: (0, web3_utils_1.hexToAscii)(ipfsHash).replace(/\0/g, ''),
                    cwUrl: (0, web3_utils_1.hexToAscii)(url).replace(/\0/g, ''),
                    creator,
                    beneficiary,
                    acceptedToken,
                    curatorFee: curatorFee.toString(),
                    threshold: threshold.toString(),
                    deadline: +deadline,
                    fundingAmount: fundingAmount.toString(),
                },
            };
        }
        case types_1.EventKind.ProjectBacked: {
            const { sender, token, amount } = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [sender],
                network: interfaces_1.SupportedNetwork.Commonwealth,
                data: {
                    kind,
                    id: rawData.address,
                    sender,
                    token,
                    amount: amount.toString(),
                },
            };
        }
        case types_1.EventKind.ProjectCurated: {
            const { sender, token, amount } = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [sender],
                network: interfaces_1.SupportedNetwork.Commonwealth,
                data: {
                    kind,
                    id: rawData.address,
                    sender,
                    token,
                    amount: amount.toString(),
                },
            };
        }
        case types_1.EventKind.ProjectSucceeded: {
            const { timestamp, amount } = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [],
                network: interfaces_1.SupportedNetwork.Commonwealth,
                data: {
                    kind,
                    id: rawData.address,
                    timestamp: timestamp.toString(),
                    amount: amount.toString(),
                },
            };
        }
        case types_1.EventKind.ProjectFailed: {
            // no arg data on failure
            return {
                blockNumber,
                excludeAddresses: [],
                network: interfaces_1.SupportedNetwork.Commonwealth,
                data: {
                    kind,
                    id: rawData.address,
                },
            };
        }
        case types_1.EventKind.ProjectWithdraw: {
            const { sender, token, amount, withdrawalType, } = rawData.args;
            return {
                blockNumber,
                excludeAddresses: [sender],
                network: interfaces_1.SupportedNetwork.Commonwealth,
                data: {
                    kind,
                    id: rawData.address,
                    sender,
                    token,
                    amount: amount.toString(),
                    withdrawalType: (0, web3_utils_1.hexToAscii)(withdrawalType).replace(/\0/g, ''),
                },
            };
        }
        default: {
            throw new Error(`Unknown event kind: ${kind}`);
        }
    }
    return {
        blockNumber: null,
        network: interfaces_1.SupportedNetwork.Commonwealth,
        data: null,
    };
}
exports.Enrich = Enrich;
