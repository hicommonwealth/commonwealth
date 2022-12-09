"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
const ethers_1 = require("ethers");
const web3_1 = __importDefault(require("web3"));
const logging_1 = require("./logging");
async function createProvider(ethNetworkUrl, network, chain) {
    const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [network, chain]));
    try {
        const web3Provider = new web3_1.default.providers.WebsocketProvider(ethNetworkUrl, {
            clientConfig: {
                maxReceivedFrameSize: 2000000,
                maxReceivedMessageSize: 10000000, // bytes - default: 8MiB, current: 10Mib
            },
            reconnect: {
                auto: true,
                delay: 5000,
                maxAttempts: 10,
                onTimeout: true,
            },
        });
        const provider = new ethers_1.providers.Web3Provider(web3Provider);
        // 12s minute polling interval (default is 4s)
        provider.pollingInterval = 12000;
        const blockNumber = await provider.getBlockNumber();
        if (!blockNumber)
            throw new Error(`A connection to ${ethNetworkUrl} could not be established.`);
        return provider;
    }
    catch (error) {
        log.error(`Failed to connect on ${ethNetworkUrl}: ${error.message}`);
        throw error;
    }
}
exports.createProvider = createProvider;
