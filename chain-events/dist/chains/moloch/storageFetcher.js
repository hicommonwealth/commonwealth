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
const types_1 = require("./types");
class StorageFetcher extends interfaces_1.IStorageFetcher {
    constructor(_api, _version, _dater, chain) {
        super(_api);
        this._api = _api;
        this._version = _version;
        this._dater = _dater;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Moloch, chain]));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isProposalV1(m) {
        return this._version === 1;
    }
    _eventsFromProposal(index, proposal, startTime, startBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            const events = [];
            if (this._isProposalV1(proposal)) {
                const proposedEvent = {
                    blockNumber: startBlock,
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind: types_1.EventKind.SubmitProposal,
                        proposalIndex: index,
                        member: proposal.proposer,
                        applicant: proposal.applicant,
                        tokenTribute: proposal.tokenTribute.toString(),
                        sharesRequested: proposal.sharesRequested.toString(),
                        details: proposal.details,
                        startTime,
                    },
                };
                events.push(proposedEvent);
                if (proposal.aborted) {
                    // derive block # from abort time
                    const maximalAbortTime = Math.min(this._currentTimestamp, (startTime + this._abortPeriod * this._periodDuration) * 1000);
                    let blockNumber;
                    if (maximalAbortTime === this._currentTimestamp) {
                        this.log.info('Still in abort window, using current timestamp.');
                        blockNumber = this._currentBlock;
                    }
                    else {
                        this.log.info(`Passed abort window, fetching timestamp ${maximalAbortTime}`);
                        try {
                            const abortBlock = yield this._dater.getDate(maximalAbortTime);
                            blockNumber = abortBlock.block;
                        }
                        catch (e) {
                            // fake it if we can't fetch it
                            this.log.error(`Unable to fetch abort block from timestamp ${maximalAbortTime}: ${e.message}.`);
                            blockNumber = startBlock + 1;
                        }
                    }
                    const abortedEvent = {
                        blockNumber,
                        network: interfaces_1.SupportedNetwork.Moloch,
                        data: {
                            kind: types_1.EventKind.Abort,
                            proposalIndex: index,
                            applicant: proposal.applicant,
                        },
                    };
                    events.push(abortedEvent);
                }
                else if (proposal.processed) {
                    // derive block # from process time
                    const minimalProcessTime = startTime +
                        (this._votingPeriod + this._gracePeriod) * this._periodDuration;
                    this.log.info(`Fetching minimum processed block at time ${minimalProcessTime}.`);
                    let blockNumber;
                    try {
                        const processedBlock = yield this._dater.getDate(minimalProcessTime * 1000);
                        blockNumber = processedBlock.block;
                    }
                    catch (e) {
                        // fake it if we can't fetch it
                        this.log.error(`Unable to fetch processed block from timestamp ${minimalProcessTime}: ${e.message}.`);
                        blockNumber = startBlock + 2;
                    }
                    const processedEvent = {
                        blockNumber,
                        network: interfaces_1.SupportedNetwork.Moloch,
                        data: {
                            kind: types_1.EventKind.ProcessProposal,
                            proposalIndex: index,
                            applicant: proposal.applicant,
                            member: proposal.proposer,
                            tokenTribute: proposal.tokenTribute.toString(),
                            sharesRequested: proposal.sharesRequested.toString(),
                            didPass: proposal.didPass,
                            yesVotes: proposal.yesVotes.toString(),
                            noVotes: proposal.noVotes.toString(),
                        },
                    };
                    events.push(processedEvent);
                }
            }
            else {
                // TODO: Moloch2
                return [];
            }
            return events;
        });
    }
    _initConstants() {
        return __awaiter(this, void 0, void 0, function* () {
            // we need to fetch a few constants to convert voting periods into blocks
            this._periodDuration = +(yield this._api.periodDuration());
            this._summoningTime = +(yield this._api.summoningTime());
            this._votingPeriod = +(yield this._api.votingPeriodLength());
            this._gracePeriod = +(yield this._api.gracePeriodLength());
            if (this._version === 1) {
                this._abortPeriod = +(yield this._api.abortWindow());
            }
            this._currentBlock = +(yield this._api.provider.getBlockNumber());
            this.log.info(`Current block: ${this._currentBlock}.`);
            this._currentTimestamp = (yield this._api.provider.getBlock(this._currentBlock)).timestamp;
            this.log.info(`Current timestamp: ${this._currentTimestamp}.`);
        });
    }
    fetchOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initConstants();
            if (!this._currentBlock) {
                this.log.error('Failed to fetch current block! Aborting fetch.');
                return [];
            }
            // fetch actual proposal
            let proposal;
            try {
                proposal =
                    this._version === 1
                        ? yield this._api.proposalQueue(id)
                        : yield this._api.proposals(id);
            }
            catch (e) {
                this.log.error(`Moloch proposal ${id} not found.`);
                return [];
            }
            this.log.debug(`Fetched Moloch proposal ${id} from storage.`);
            // compute starting time and derive closest block number
            const startingPeriod = +proposal.startingPeriod;
            const proposalStartingTime = startingPeriod * this._periodDuration + this._summoningTime;
            this.log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
            let proposalStartBlock;
            try {
                const block = yield this._dater.getDate(proposalStartingTime * 1000);
                proposalStartBlock = block.block;
                this.log.debug(`For timestamp ${block.date}, fetched ETH block #${block.block}.`);
            }
            catch (e) {
                this.log.error(`Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`);
                this.log.error('Skipping proposal event fetch.');
                // eslint-disable-next-line no-continue
                return [];
            }
            const events = yield this._eventsFromProposal(+id, proposal, proposalStartingTime, proposalStartBlock);
            return events;
        });
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
    fetch(range, fetchAllCompleted = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initConstants();
            if (!this._currentBlock) {
                this.log.error('Failed to fetch current block! Aborting fetch.');
                return [];
            }
            // populate range fully if not given
            if (!range) {
                range = { startBlock: 0, endBlock: this._currentBlock };
            }
            else if (!range.startBlock) {
                range.startBlock = 0;
            }
            else if (range.startBlock >= this._currentBlock) {
                this.log.error(`Start block ${range.startBlock} greater than current block ${this._currentBlock}!`);
                return [];
            }
            if (range.endBlock && range.startBlock >= range.endBlock) {
                this.log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
                return [];
            }
            if (!range.endBlock) {
                range.endBlock = this._currentBlock;
            }
            this.log.info(`Fetching Moloch entities for range: ${range.startBlock}-${range.endBlock}.`);
            const queueLength = +(yield this._api.getProposalQueueLength());
            const results = [];
            let nFetched = 0;
            for (let i = 0; i < queueLength; i++) {
                // work backwards through the queue, starting with the most recent
                const queuePosition = queueLength - i - 1;
                const proposalIndex = this._version === 1
                    ? queuePosition
                    : +(yield this._api.proposalQueue(queuePosition));
                // fetch actual proposal
                const proposal = this._version === 1
                    ? yield this._api.proposalQueue(proposalIndex)
                    : yield this._api.proposals(proposalIndex);
                this.log.debug(`Fetched Moloch proposal ${proposalIndex} from storage.`);
                // compute starting time and derive closest block number
                const startingPeriod = +proposal.startingPeriod;
                const proposalStartingTime = startingPeriod * this._periodDuration + this._summoningTime;
                this.log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
                let proposalStartBlock;
                try {
                    const block = yield this._dater.getDate(proposalStartingTime * 1000);
                    proposalStartBlock = block.block;
                    this.log.debug(`For timestamp ${block.date}, fetched ETH block #${block.block}.`);
                }
                catch (e) {
                    this.log.error(`Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`);
                    this.log.error('Skipping proposal event fetch.');
                    // eslint-disable-next-line no-continue
                    continue;
                }
                if (proposalStartBlock >= range.startBlock &&
                    proposalStartBlock <= range.endBlock) {
                    const events = yield this._eventsFromProposal(proposalIndex, proposal, proposalStartingTime, proposalStartBlock);
                    results.push(...events);
                    nFetched += 1;
                    // halt fetch once we find a completed proposal in order to save data
                    // we may want to run once without this, in order to fetch backlog, or else develop a pagination
                    // strategy, but for now our API usage is limited.
                    if (!fetchAllCompleted &&
                        events.find((p) => p.data.kind === types_1.EventKind.ProcessProposal)) {
                        this.log.debug(`Proposal ${proposalIndex} is marked processed, halting fetch.`);
                        break;
                    }
                    if (range.maxResults && nFetched >= range.maxResults) {
                        this.log.debug(`Fetched ${nFetched} proposals, halting fetch.`);
                        break;
                    }
                }
                else if (proposalStartBlock < range.startBlock) {
                    this.log.debug(`Moloch proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`);
                    break;
                }
                else if (proposalStartBlock > range.endBlock) {
                    // keep walking backwards until within range
                    this.log.debug(`Moloch proposal start block (${proposalStartBlock}) is after ${range.endBlock}, ending fetch.`);
                }
            }
            return results;
        });
    }
}
exports.StorageFetcher = StorageFetcher;
//# sourceMappingURL=storageFetcher.js.map