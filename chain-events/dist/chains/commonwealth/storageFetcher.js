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
exports.StorageFetcher = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const enricher_1 = require("./filters/enricher");
const types_1 = require("./types");
class StorageFetcher extends interfaces_1.IStorageFetcher {
    constructor(_api, chain) {
        super(_api);
        this._api = _api;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Commonwealth, chain]));
        this.chain = chain;
    }
    fetchOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this._currentBlock = +(yield this._api.factory.provider.getBlockNumber());
            this.log.info(`Current block: ${this._currentBlock}.`);
            if (!this._currentBlock) {
                this.log.error('Failed to fetch current block! Aborting fetch.');
                return [];
            }
            // TODO: can we make this more efficient?
            const allProposals = yield this.fetch();
            return allProposals.filter((v) => v.data.id === id);
        });
    }
    /**
     * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
     *   by quering available chain/contract storage and reconstructing events.
     *
     * NOTE: throws on error! Make sure to wrap in try/catch!
     *
     * @param range Determines the range of blocks to query events within.
     */
    fetch(range) {
        return __awaiter(this, void 0, void 0, function* () {
            this._currentBlock = yield this._api.factory.provider.getBlockNumber();
            this.log.info(`Current block: ${this._currentBlock}.`);
            if (!this._currentBlock) {
                this.log.error('Failed to fetch current block! Aborting fetch.');
                return [];
            }
            // populate range fully if not given
            if (!range) {
                range = { startBlock: 0 };
            }
            else if (!range.startBlock) {
                range.startBlock = 0;
            }
            else if (range.startBlock >= this._currentBlock) {
                this.log.error(`Start block ${range.startBlock} greater than current block ${this._currentBlock}!`);
                return [];
            }
            if (!range.endBlock) {
                range.endBlock = this._currentBlock;
            }
            if (range.startBlock >= range.endBlock) {
                this.log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
                return [];
            }
            this.log.info(`Fetching Commonwealth entities for range: ${range.startBlock}-${range.endBlock}.`);
            const fetchEvents = (filterCall, eventKind) => __awaiter(this, void 0, void 0, function* () {
                const events = yield filterCall();
                return Promise.all(events.map((evt) => {
                    try {
                        return enricher_1.Enrich(this._api, evt.blockNumber, eventKind, evt);
                    }
                    catch (e) {
                        this.log.error(`Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${eventKind}, Error Message: ${e.message}`);
                        // maintain previous functionality of throwing
                        throw new Error(e.message);
                    }
                }));
            });
            // fetch factory events
            const projectCreatedEvents = yield fetchEvents(() => {
                return this._api.factory.queryFilter(this._api.factory.filters.ProjectCreated(null, null), range.startBlock, range.endBlock);
            }, types_1.EventKind.ProjectCreated);
            // fetch events on individual projects
            const projectEvents = [];
            for (const project of this._api.projects) {
                const backedEvents = yield fetchEvents(() => {
                    return project.project.queryFilter(project.project.filters.Back(null, null, null), range.startBlock, range.endBlock);
                }, types_1.EventKind.ProjectBacked);
                const curateEvents = yield fetchEvents(() => {
                    return project.project.queryFilter(project.project.filters.Curate(null, null, null), range.startBlock, range.endBlock);
                }, types_1.EventKind.ProjectCurated);
                const successEvents = yield fetchEvents(() => {
                    return project.project.queryFilter(project.project.filters.Succeeded(null, null), range.startBlock, range.endBlock);
                }, types_1.EventKind.ProjectSucceeded);
                const failureEvents = yield fetchEvents(() => {
                    return project.project.queryFilter(project.project.filters.Failed(), range.startBlock, range.endBlock);
                }, types_1.EventKind.ProjectFailed);
                const withdrawEvents = yield fetchEvents(() => {
                    return project.project.queryFilter(project.project.filters.Withdraw(null, null, null, null), range.startBlock, range.endBlock);
                }, types_1.EventKind.ProjectWithdraw);
                projectEvents.push(...backedEvents, ...curateEvents, ...successEvents, ...failureEvents, ...withdrawEvents);
            }
            return [...projectCreatedEvents, ...projectEvents].sort((e1, e2) => e1.blockNumber - e2.blockNumber);
        });
    }
}
exports.StorageFetcher = StorageFetcher;
//# sourceMappingURL=storageFetcher.js.map