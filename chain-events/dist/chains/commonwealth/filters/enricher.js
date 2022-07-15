"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrich = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const web3_utils_1 = require("web3-utils");
const contractTypes_1 = require("../../../contractTypes");
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
function Enrich(api, blockNumber, kind, rawData) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (kind) {
            case types_1.EventKind.ProjectCreated: {
                const { projectIndex, projectAddress } = rawData.args;
                const projectContract = contractTypes_1.ICuratedProject__factory.connect(projectAddress, api.factory.provider);
                const { id, name, ipfsHash, url, creator, } = yield projectContract.metaData();
                const { threshold, deadline, beneficiary, acceptedToken, } = yield projectContract.projectData();
                const curatorFee = yield projectContract.curatorFee();
                const fundingAmount = yield projectContract.totalFunding();
                return {
                    blockNumber,
                    excludeAddresses: [],
                    network: interfaces_1.SupportedNetwork.Commonwealth,
                    data: {
                        kind,
                        id: projectAddress,
                        index: projectIndex.toString(),
                        name: web3_utils_1.hexToAscii(name).replace(/\0/g, ''),
                        ipfsHash: web3_utils_1.hexToAscii(ipfsHash).replace(/\0/g, ''),
                        cwUrl: web3_utils_1.hexToAscii(url).replace(/\0/g, ''),
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
                        withdrawalType: web3_utils_1.hexToAscii(withdrawalType).replace(/\0/g, ''),
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
    });
}
exports.Enrich = Enrich;
//# sourceMappingURL=enricher.js.map