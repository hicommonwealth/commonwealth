"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageFetcher = void 0;
const util_1 = require("../../util");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const enricher_1 = require("./filters/enricher");
const types_1 = require("./types");
class StorageFetcher extends interfaces_1.IStorageFetcher {
    _api;
    log;
    chain;
    constructor(_api, chain) {
        super(_api);
        this._api = _api;
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Commonwealth, chain]));
        this.chain = chain;
    }
    _currentBlock;
    async fetchOne(id) {
        this._currentBlock = +(await this._api.factory.provider.getBlockNumber());
        this.log.info(`Current block: ${this._currentBlock}.`);
        if (!this._currentBlock) {
            this.log.error('Failed to fetch current block! Aborting fetch.');
            return [];
        }
        // TODO: can we make this more efficient?
        const allProposals = await this.fetch();
        return allProposals.filter((v) => v.data.id === id);
    }
    /**
     * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
     *   by quering available chain/contract storage and reconstructing events.
     *
     * NOTE: throws on error! Make sure to wrap in try/catch!
     *
     * @param range Determines the range of blocks to query events within.
     */
    async fetch(range) {
        this._currentBlock = await this._api.factory.provider.getBlockNumber();
        this.log.info(`Current block: ${this._currentBlock}.`);
        if (!this._currentBlock) {
            this.log.error('Failed to fetch current block! Aborting fetch.');
            return [];
        }
        range = (0, util_1.populateRange)(range, this._currentBlock);
        this.log.info(`Fetching Commonwealth entities for range: ${range.startBlock}-${range.endBlock}.`);
        const fetchEvents = async (filterCall, eventKind) => {
            const events = await filterCall();
            return Promise.all(events.map((evt) => {
                try {
                    return (0, enricher_1.Enrich)(this._api, evt.blockNumber, eventKind, evt);
                }
                catch (e) {
                    this.log.error(`Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${eventKind}, Error Message: ${e.message}`);
                    // maintain previous functionality of throwing
                    throw new Error(e.message);
                }
            }));
        };
        // fetch factory events
        const projectCreatedEvents = await fetchEvents(() => {
            return this._api.factory.queryFilter(this._api.factory.filters.ProjectCreated(null, null), range.startBlock, range.endBlock);
        }, types_1.EventKind.ProjectCreated);
        // fetch events on individual projects
        const projectEvents = [];
        for (const project of this._api.projects) {
            const backedEvents = await fetchEvents(() => {
                return project.project.queryFilter(project.project.filters.Back(null, null, null), range.startBlock, range.endBlock);
            }, types_1.EventKind.ProjectBacked);
            const curateEvents = await fetchEvents(() => {
                return project.project.queryFilter(project.project.filters.Curate(null, null, null), range.startBlock, range.endBlock);
            }, types_1.EventKind.ProjectCurated);
            const successEvents = await fetchEvents(() => {
                return project.project.queryFilter(project.project.filters.Succeeded(null, null), range.startBlock, range.endBlock);
            }, types_1.EventKind.ProjectSucceeded);
            const failureEvents = await fetchEvents(() => {
                return project.project.queryFilter(project.project.filters.Failed(), range.startBlock, range.endBlock);
            }, types_1.EventKind.ProjectFailed);
            const withdrawEvents = await fetchEvents(() => {
                return project.project.queryFilter(project.project.filters.Withdraw(null, null, null, null), range.startBlock, range.endBlock);
            }, types_1.EventKind.ProjectWithdraw);
            projectEvents.push(...backedEvents, ...curateEvents, ...successEvents, ...failureEvents, ...withdrawEvents);
        }
        return [...projectCreatedEvents, ...projectEvents].sort((e1, e2) => e1.blockNumber - e2.blockNumber);
    }
}
exports.StorageFetcher = StorageFetcher;
