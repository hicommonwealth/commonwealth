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
exports.createListener = exports.Label = exports.Title = void 0;
const interfaces_1 = require("./interfaces");
const substrate_1 = require("./chains/substrate");
const moloch_1 = require("./chains/moloch");
const compound_1 = require("./chains/compound");
const erc20_1 = require("./chains/erc20");
const erc721_1 = require("./chains/erc721");
const aave_1 = require("./chains/aave");
const commonwealth_1 = require("./chains/commonwealth");
const logging_1 = require("./logging");
function Title(network, kind) {
    switch (network) {
        case interfaces_1.SupportedNetwork.Substrate:
            return substrate_1.Title(kind);
        case interfaces_1.SupportedNetwork.Aave:
            return aave_1.Title(kind);
        case interfaces_1.SupportedNetwork.Compound:
            return compound_1.Title(kind);
        case interfaces_1.SupportedNetwork.ERC20:
            return erc20_1.Title(kind);
        case interfaces_1.SupportedNetwork.ERC721:
            return erc721_1.Title(kind);
        case interfaces_1.SupportedNetwork.Moloch:
            return moloch_1.Title(kind);
        case interfaces_1.SupportedNetwork.Commonwealth:
            return commonwealth_1.Title(kind);
        default:
            throw new Error(`Invalid network: ${network}`);
    }
}
exports.Title = Title;
function Label(chain, event) {
    switch (event.network) {
        case interfaces_1.SupportedNetwork.Substrate:
            return substrate_1.Label(event.blockNumber, chain, event.data);
        case interfaces_1.SupportedNetwork.Aave:
            return aave_1.Label(event.blockNumber, chain, event.data);
        case interfaces_1.SupportedNetwork.Compound:
            return compound_1.Label(event.blockNumber, chain, event.data);
        case interfaces_1.SupportedNetwork.ERC20:
            return erc20_1.Label(event.blockNumber, chain, event.data);
        case interfaces_1.SupportedNetwork.ERC721:
            return erc721_1.Label(event.blockNumber, chain, event.data);
        case interfaces_1.SupportedNetwork.Moloch:
            return moloch_1.Label(event.blockNumber, chain, event.data);
        case interfaces_1.SupportedNetwork.Commonwealth:
            return commonwealth_1.Label(event.blockNumber, chain, event.data);
        default:
            throw new Error(`Invalid network: ${event.network}`);
    }
}
exports.Label = Label;
/**
 * Creates a listener instance and returns it if no error occurs. This function throws on error.
 * @param chain The chain to create a listener for
 * @param options The listener options for the specified chain
 * @param network the listener network to use
 */
function createListener(chain, network, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let listener;
        const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [network, chain]));
        if (network === interfaces_1.SupportedNetwork.Substrate) {
            // start a substrate listener
            listener = new substrate_1.Listener(chain, options.url, options.spec, !!options.archival, options.startBlock || 0, !!options.skipCatchup, options.enricherConfig, !!options.verbose, options.discoverReconnectRange);
        }
        else if (network === interfaces_1.SupportedNetwork.Moloch) {
            listener = new moloch_1.Listener(chain, options.MolochContractVersion ? options.MolochContractVersion : 2, options.address, options.url, !!options.skipCatchup, !!options.verbose, options.discoverReconnectRange);
        }
        else if (network === interfaces_1.SupportedNetwork.Compound) {
            listener = new compound_1.Listener(chain, options.address, options.url, !!options.skipCatchup, !!options.verbose, options.discoverReconnectRange);
        }
        else if (network === interfaces_1.SupportedNetwork.ERC20) {
            listener = new erc20_1.Listener(chain, options.tokenAddresses || [options.address], options.url, Array.isArray(options.tokenNames) ? options.tokenNames : undefined, options.enricherConfig, !!options.verbose);
        }
        else if (network === interfaces_1.SupportedNetwork.ERC721) {
            listener = new erc721_1.Listener(chain, options.tokenAddresses || [options.address], options.url, Array.isArray(options.tokenNames) ? options.tokenNames : undefined, !!options.verbose);
        }
        else if (network === interfaces_1.SupportedNetwork.Aave) {
            listener = new aave_1.Listener(chain, options.address, options.url, !!options.skipCatchup, !!options.verbose, options.discoverReconnectRange);
        }
        else if (network === interfaces_1.SupportedNetwork.Commonwealth) {
            listener = new commonwealth_1.Listener(chain, options.address, options.url, !!options.skipCatchup, !!options.verbose, options.discoverReconnectRange);
        }
        else {
            throw new Error(`Invalid network: ${network}`);
        }
        try {
            if (!listener)
                throw new Error('Listener is still null');
            yield listener.init();
        }
        catch (error) {
            log.error(`Failed to initialize the listener`);
            throw error;
        }
        return listener;
    });
}
exports.createListener = createListener;
//# sourceMappingURL=util.js.map