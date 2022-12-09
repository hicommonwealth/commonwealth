"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const interfaces_1 = require("../../interfaces");
const contractTypes_1 = require("../../contractTypes");
const logging_1 = require("../../logging");
class Subscriber extends interfaces_1.IEventSubscriber {
    _name;
    _listener;
    constructor(api, name, verbose = false) {
        super(api, verbose);
        this._name = name;
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    async subscribe(cb) {
        this._listener = (tokenName, event) => {
            const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.ERC721, tokenName]));
            const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
            // eslint-disable-next-line no-unused-expressions
            this._verbose ? log.info(logStr) : log.trace(logStr);
            cb(event, tokenName);
        };
        this._api.tokens.forEach(({ contract, tokenName }) => contract.on('*', this._listener.bind(this, tokenName)));
    }
    unsubscribe() {
        if (this._listener) {
            this._api.tokens.forEach(({ contract }) => contract.removeAllListeners());
            this._listener = null;
        }
    }
    async addNewToken(tokenAddress, tokenName, retryTimeMs = 10 * 1000, retries = 5) {
        const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.ERC721, tokenName]));
        const existingToken = this.api.tokens.find(({ contract }) => {
            return contract.address === tokenAddress;
        });
        if (existingToken) {
            log.info('Token is already being monitored');
            return;
        }
        try {
            const contract = contractTypes_1.ERC721__factory.connect(tokenAddress, this.api.provider);
            await contract.deployed();
            this.api.tokens.push({ contract, tokenName });
            contract.on('*', this._listener.bind(this, tokenName));
        }
        catch (e) {
            await (0, sleep_promise_1.default)(retryTimeMs);
            if (retries > 0) {
                log.error('Retrying connection...');
                this.addNewToken(tokenAddress, tokenName, retryTimeMs, retries - 1);
            }
        }
    }
}
exports.Subscriber = Subscriber;
