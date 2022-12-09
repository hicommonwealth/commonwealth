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
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Aave, chain]));
        this.chain = chain;
    }
    _currentBlock;
    async fetchOne(id) {
        this._currentBlock = +(await this._api.governance.provider.getBlockNumber());
        this.log.info(`Current block: ${this._currentBlock}.`);
        if (!this._currentBlock) {
            this.log.error('Failed to fetch current block! Aborting fetch.');
            return [];
        }
        // TODO: can we make this more efficient?
        const allProposals = await this.fetch();
        return allProposals.filter((v) => v.data.id === +id);
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
        this._currentBlock = await this._api.governance.provider.getBlockNumber();
        this.log.info(`Current block: ${this._currentBlock}.`);
        if (!this._currentBlock) {
            this.log.error('Failed to fetch current block! Aborting fetch.');
            return [];
        }
        range = (0, util_1.populateRange)(range, this._currentBlock);
        this.log.info(`Fetching Aave entities for range: ${range.startBlock}-${range.endBlock}.`);
        const proposalCreatedEvents = await this._api.governance.queryFilter(this._api.governance.filters.ProposalCreated(null, null, null, null, null, null, null, null, null, null, null, null), range.startBlock, range.endBlock);
        const createdCwEvents = await Promise.all(proposalCreatedEvents.map((evt) => {
            try {
                return (0, enricher_1.Enrich)(this._api, evt.blockNumber, types_1.EventKind.ProposalCreated, evt);
            }
            catch (e) {
                this.log.error(`Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${types_1.EventKind.ProposalCreated}, Error Message: ${e.message}`);
                // maintain previous functionality of throwing
                throw new Error(e.message);
            }
        }));
        const voteEmittedEvents = await this._api.governance.queryFilter(this._api.governance.filters.VoteEmitted(null, null, null, null), range.startBlock, range.endBlock);
        const voteCwEvents = await Promise.all(voteEmittedEvents.map((evt) => {
            try {
                return (0, enricher_1.Enrich)(this._api, evt.blockNumber, types_1.EventKind.VoteEmitted, evt);
            }
            catch (e) {
                this.log.error(`Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${types_1.EventKind.VoteEmitted}, Error Message: ${e.message}`);
                // maintain previous functionality of throwing
                throw new Error(e.message);
            }
        }));
        const proposalQueuedEvents = await this._api.governance.queryFilter(this._api.governance.filters.ProposalQueued(null, null, null), range.startBlock, range.endBlock);
        const queuedCwEvents = await Promise.all(proposalQueuedEvents.map((evt) => {
            try {
                return (0, enricher_1.Enrich)(this._api, evt.blockNumber, types_1.EventKind.ProposalQueued, evt);
            }
            catch (e) {
                this.log.error(`Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${types_1.EventKind.ProposalQueued}, Error Message: ${e.message}`);
                // maintain previous functionality of throwing
                throw new Error(e.message);
            }
        }));
        const proposalCanceledEvents = await this._api.governance.queryFilter(this._api.governance.filters.ProposalCanceled(null), range.startBlock, range.endBlock);
        const cancelledCwEvents = await Promise.all(proposalCanceledEvents.map((evt) => {
            try {
                return (0, enricher_1.Enrich)(this._api, evt.blockNumber, types_1.EventKind.ProposalCanceled, evt);
            }
            catch (e) {
                this.log.error(`Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${types_1.EventKind.ProposalCanceled}, Error Message: ${e.message}`);
                // maintain previous functionality of throwing
                throw new Error(e.message);
            }
        }));
        const proposalExecutedEvents = await this._api.governance.queryFilter(this._api.governance.filters.ProposalExecuted(null, null), range.startBlock, range.endBlock);
        const executedCwEvents = await Promise.all(proposalExecutedEvents.map((evt) => {
            try {
                return (0, enricher_1.Enrich)(this._api, evt.blockNumber, types_1.EventKind.ProposalExecuted, evt);
            }
            catch (e) {
                this.log.error(`Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${types_1.EventKind.ProposalExecuted}, Error Message: ${e.message}`);
                // maintain previous functionality of throwing
                throw new Error(e.message);
            }
        }));
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
