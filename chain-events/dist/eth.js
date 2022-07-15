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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
const ethers_1 = require("ethers");
const web3_1 = __importDefault(require("web3"));
const logging_1 = require("./logging");
function createProvider(ethNetworkUrl, network, chain) {
    return __awaiter(this, void 0, void 0, function* () {
        const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [network, chain]));
        try {
            const web3Provider = new web3_1.default.providers.WebsocketProvider(ethNetworkUrl, {
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
            const blockNumber = yield provider.getBlockNumber();
            if (!blockNumber)
                throw new Error(`A connection to ${ethNetworkUrl} could not be established.`);
            return provider;
        }
        catch (error) {
            log.error(`Failed to connect on ${ethNetworkUrl}: ${error.message}`);
            throw error;
        }
    });
}
exports.createProvider = createProvider;
//# sourceMappingURL=eth.js.map