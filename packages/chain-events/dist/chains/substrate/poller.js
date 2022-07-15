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
exports.Poller = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
class Poller extends interfaces_1.IEventPoller {
    constructor(_api, chain) {
        super(_api);
        this._api = _api;
        this.chain = chain;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Substrate, chain]));
    }
    /**
     * Connects to chain, fetches specified blocks and passes them
     * along for processing.
     *
     * @param range The range of block numbers to poll
     * @param maxRange The maximum number of blocks to poll
     */
    poll(range, maxRange = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            // discover current block if no end block provided
            if (!range.endBlock) {
                const header = yield this._api.rpc.chain.getHeader();
                range.endBlock = +header.number;
                this.log.info(`Discovered endBlock: ${range.endBlock}`);
            }
            if (range.endBlock - range.startBlock <= 0) {
                this.log.error(`End of range (${range.endBlock}) <= start (${range.startBlock})! No blocks to fetch.`);
                return [];
            }
            if (range.endBlock - range.startBlock > maxRange) {
                this.log.info(`Attempting to poll ${range.endBlock - range.startBlock} blocks, reducing query size to ${maxRange}.`);
                range.startBlock = range.endBlock - maxRange;
            }
            // discover current version
            const version = yield this._api.rpc.state.getRuntimeVersion();
            const versionNumber = +version.specVersion;
            const versionName = version.specName.toString();
            // TODO: on newer versions of Substrate, a "system.lastRuntimeUpgrade" query is exposed,
            //   which will tell us if we hit an upgrade during the polling period. But for now, we
            //   can assume that the chain has not been upgraded during the offline polling period
            //   (which for a non-archive node, is only the most recent 250 blocks anyway).
            // fetch blocks from start to end
            const blockNumbers = [
                ...Array(range.endBlock - range.startBlock).keys(),
            ].map((i) => range.startBlock + i);
            this.log.info(`Fetching hashes for blocks: ${JSON.stringify(blockNumbers)}`);
            // the hashes are pruned when using api.query.system.blockHash.multi
            // therefore fetching hashes from chain. the downside is that for every
            // single hash a separate request is made
            const hashes = yield Promise.all(blockNumbers.map((number) => this._api.rpc.chain.getBlockHash(number)));
            // remove all-0 block hashes -- those blocks have been pruned & we cannot fetch their data
            const nonZeroHashes = hashes.filter((hash) => !hash.isEmpty);
            this.log.info(`${nonZeroHashes.length} active and ${hashes.length - nonZeroHashes.length} pruned hashes fetched!`);
            this.log.debug('Fetching headers and events...');
            const blocks = yield Promise.all(nonZeroHashes.map((hash) => __awaiter(this, void 0, void 0, function* () {
                const header = yield this._api.rpc.chain.getHeader(hash);
                const events = yield this._api.query.system.events.at(hash);
                const signedBlock = yield this._api.rpc.chain.getBlock(hash);
                const { extrinsics } = signedBlock.block;
                this.log.trace(`Fetched Block for ${versionName}:${versionNumber}: ${+header.number}`);
                return { header, events, extrinsics, versionNumber, versionName };
            })));
            this.log.info('Finished polling past blocks!');
            return blocks;
        });
    }
    /**
     * Connects to chain, fetches blocks specified in given range in provided batch size,
     * prcoesses the blocks if a handler is provided
     * @param range IDisconnectedRange having startBlock and optional endBlock
     * @param batchSize size of the batch in which blocks are to be fetched from chain
     * @param processBlockFn an optional function to process the blocks
     */
    archive(range, batchSize = 500, processBlockFn = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const syncWithHead = !range.endBlock;
            // if the endBlock is not provided then we will run archival mode until we reach the head
            if (syncWithHead) {
                const header = yield this._api.rpc.chain.getHeader();
                range.endBlock = +header.number;
            }
            for (let block = range.startBlock; block < range.endBlock; block = Math.min(block + batchSize, range.endBlock)) {
                try {
                    const currentBlocks = yield this.poll({
                        startBlock: block,
                        endBlock: Math.min(block + batchSize, range.endBlock),
                    }, batchSize);
                    // process all blocks sequentially
                    if (processBlockFn) {
                        for (const b of currentBlocks) {
                            yield processBlockFn(b);
                        }
                    }
                }
                catch (e) {
                    this.log.error(`Block polling failed after disconnect at block ${range.startBlock}`);
                    return;
                }
                // if sync with head then update the endBlock to current header
                if (syncWithHead) {
                    const header = yield this._api.rpc.chain.getHeader();
                    range.endBlock = +header.number;
                }
            }
        });
    }
}
exports.Poller = Poller;
//# sourceMappingURL=poller.js.map