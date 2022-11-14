"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
/**
 * Fetches events from Cosmos chain in real time.
 */
const proto_signing_1 = require("@cosmjs/proto-signing");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
class Subscriber extends interfaces_1.IEventSubscriber {
    _name;
    _pollTime;
    _listener;
    _lastBlockHeight = null;
    log;
    constructor(api, name, pollTime = 15 * 1000, verbose = false) {
        super(api, verbose);
        this._name = name;
        this._pollTime = pollTime;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Cosmos, this._name]));
    }
    async _queryBlocks() {
        const lastBlockHeight = this._lastBlockHeight;
        const currentBlock = await this.api.tm.block();
        const currentHeight = currentBlock.block.header.height;
        this._lastBlockHeight = currentHeight;
        if (lastBlockHeight === null) {
            // query initial block only when uninitialized
            return [currentBlock.block];
        }
        // query all blocks before latest, walking backwards from current
        const results = [currentBlock.block];
        for (let blockN = currentHeight - 1; blockN > lastBlockHeight; blockN--) {
            try {
                const block = await this.api.tm.block(blockN);
                results.push(block.block);
            }
            catch (e) {
                this.log.warn(`Failed to fetch block ${blockN} (${e.message}), aborting re-subscribe`);
                break;
            }
        }
        return results;
    }
    _blocksToEvents(blocks) {
        // parse all transactions
        const events = [];
        for (const block of blocks) {
            const { header: { height }, } = block;
            for (const tx of block.txs) {
                const decodedTx = proto_signing_1.decodeTxRaw(tx);
                const { body: { messages }, } = decodedTx;
                for (const message of messages) {
                    events.push({ height, message });
                }
            }
        }
        return events;
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    async subscribe(cb, disconnectedRange) {
        if (disconnectedRange?.startBlock) {
            // set disconnected range to recover past blocks via "polling"
            this._lastBlockHeight = disconnectedRange.startBlock;
            this.log.info(`Polling Cosmos "${this._name}" events from ${this._lastBlockHeight}.`);
        }
        const listenFunc = async () => {
            const blocks = await this._queryBlocks();
            const events = this._blocksToEvents(blocks);
            for (const event of events) {
                cb(event);
            }
        };
        await listenFunc();
        this.log.info(`Starting Cosmos "${this._name}" listener.`);
        this._listener = setInterval(listenFunc, this._pollTime);
    }
    unsubscribe() {
        if (this._listener) {
            clearInterval(this._listener);
            this._listener = null;
        }
    }
}
exports.Subscriber = Subscriber;
