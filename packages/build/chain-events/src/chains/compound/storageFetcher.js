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
    constructor(_api, chain) {
        super(_api);
        this._api = _api;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Compound, chain]));
    }
    _currentBlock;
    async fetchOne(id) {
        this._currentBlock = +(await this._api.provider.getBlockNumber());
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
     * @param fetchAllCompleted
     */
    async fetch(range) {
        this._currentBlock = await this._api.provider.getBlockNumber();
        this.log.info(`Current block: ${this._currentBlock}.`);
        if (!this._currentBlock) {
            this.log.error(`Failed to fetch current block! Aborting fetch.`);
            return [];
        }
        range = util_1.populateRange(range, this._currentBlock);
        this.log.info(`Fetching Compound entities for range: ${range.startBlock}-${range.endBlock}.`);
        const proposalCreatedEvents = await this._api.queryFilter(this._api.filters.ProposalCreated(null, null, null, null, null, null, null, null, null), range.startBlock, range.endBlock);
        const createdCwEvents = await Promise.all(proposalCreatedEvents.map((evt) => enricher_1.Enrich(this._api, evt.blockNumber, types_1.EventKind.ProposalCreated, evt)));
        const voteCastEvents = await this._api.queryFilter(types_1.isGovernorAlpha(this._api)
            ? this._api.filters.VoteCast(null, null, null, null)
            : this._api.filters.VoteCast(null, null, null, null, null), range.startBlock, range.endBlock);
        const voteCwEvents = await Promise.all(voteCastEvents.map((evt) => enricher_1.Enrich(this._api, evt.blockNumber, types_1.EventKind.VoteCast, evt)));
        let queuedCwEvents = [];
        try {
            const proposalQueuedEvents = await this._api.queryFilter(this._api.filters.ProposalQueued(null, null), range.startBlock, range.endBlock);
            queuedCwEvents = await Promise.all(proposalQueuedEvents.map((evt) => enricher_1.Enrich(this._api, evt.blockNumber, types_1.EventKind.ProposalQueued, evt)));
        }
        catch (e) {
            this.log.warn('Could not fetched queued events.');
        }
        const proposalCanceledEvents = await this._api.queryFilter(this._api.filters.ProposalCanceled(null), range.startBlock, range.endBlock);
        const cancelledCwEvents = await Promise.all(proposalCanceledEvents.map((evt) => enricher_1.Enrich(this._api, evt.blockNumber, types_1.EventKind.ProposalCanceled, evt)));
        const proposalExecutedEvents = await this._api.queryFilter(this._api.filters.ProposalExecuted(null), range.startBlock, range.endBlock);
        const executedCwEvents = await Promise.all(proposalExecutedEvents.map((evt) => enricher_1.Enrich(this._api, evt.blockNumber, types_1.EventKind.ProposalExecuted, evt)));
        return [
            ...createdCwEvents,
            ...voteCwEvents,
            ...queuedCwEvents,
            ...cancelledCwEvents,
            ...executedCwEvents,
        ].sort((e1, e2) => e1.blockNumber - e2.blockNumber);
    }
}
exports.StorageFetcher = StorageFetcher;
