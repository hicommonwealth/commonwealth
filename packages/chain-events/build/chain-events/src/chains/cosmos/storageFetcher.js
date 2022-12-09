"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageFetcher = void 0;
const gov_1 = require("cosmjs-types/cosmos/gov/v1beta1/gov");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const types_1 = require("./types");
const dateToUnix = (d) => {
    if (d)
        return Math.floor(d.getTime() / 1000);
    return undefined;
};
class StorageFetcher extends interfaces_1.IStorageFetcher {
    _api;
    log;
    constructor(_api, chain) {
        super(_api);
        this._api = _api;
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Cosmos, chain]));
    }
    _currentBlock;
    // Gets all items from a particular paginated cosmos request keyed by "key", using
    // the standard pagination system.
    // TODO: throttling to get around endpoint limits?
    async _getAllPaginated(func, key) {
        this.log.info(`Querying first page...`);
        const result = await func();
        const data = result[key];
        if (result.pagination) {
            let { nextKey } = result.pagination;
            while (nextKey.length > 0) {
                this.log.info(`Querying next page...`);
                const nextData = await func(nextKey);
                data.push(...nextData[key]);
                nextKey = nextData.pagination.nextKey;
            }
        }
        return data;
    }
    async _proposalToEvents(proposal) {
        const events = [];
        // NOTE: we cannot query the actual submission block
        const submitEvent = {
            blockNumber: this._currentBlock,
            network: interfaces_1.SupportedNetwork.Cosmos,
            data: {
                kind: types_1.EventKind.SubmitProposal,
                id: proposal.proposalId.toString(10),
                content: {
                    typeUrl: proposal.content.typeUrl,
                    value: Buffer.from(proposal.content.value).toString('hex'),
                },
                submitTime: dateToUnix(proposal.submitTime),
                depositEndTime: dateToUnix(proposal.depositEndTime),
                votingStartTime: dateToUnix(proposal.votingStartTime),
                votingEndTime: dateToUnix(proposal.votingEndTime),
                // TODO: do we need to query the tally separately if it's complete?
                finalTallyResult: proposal.finalTallyResult,
                totalDeposit: proposal.totalDeposit && (0, types_1.coinToCoins)(proposal.totalDeposit),
            },
        };
        events.push(submitEvent);
        if (proposal.status === gov_1.ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD) {
            // query deposit events if active
            this.log.info(`Starting paginated deposits query...`);
            const deposits = await this._getAllPaginated((key) => this._api.lcd.gov.deposits(proposal.proposalId, key), 'deposits');
            const depositEvents = deposits.map((d) => ({
                blockNumber: this._currentBlock,
                network: interfaces_1.SupportedNetwork.Cosmos,
                data: {
                    kind: types_1.EventKind.Deposit,
                    id: proposal.proposalId.toString(10),
                    depositor: d.depositor,
                    amount: (0, types_1.coinToCoins)(d.amount),
                },
            }));
            events.push(...depositEvents);
        }
        else if (proposal.status === gov_1.ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD) {
            // query voting events if active
            this.log.info(`Starting paginated votes query...`);
            const votes = await this._getAllPaginated((key) => this._api.lcd.gov.votes(proposal.proposalId, key), 'votes');
            const voteEvents = votes.map((v) => ({
                blockNumber: this._currentBlock,
                network: interfaces_1.SupportedNetwork.Cosmos,
                data: {
                    kind: types_1.EventKind.Vote,
                    id: proposal.proposalId.toString(10),
                    voter: v.voter,
                    option: v.option,
                },
            }));
            events.push(...voteEvents);
        }
        return events;
    }
    async fetchOne(id) {
        this._currentBlock = (await this._api.tm.block()).block.header.height;
        this.log.info(`Current block: ${this._currentBlock}.`);
        if (!this._currentBlock) {
            this.log.error('Failed to fetch current block! Aborting fetch.');
            return [];
        }
        const { proposal } = await this._api.lcd.gov.proposal(id);
        return this._proposalToEvents(proposal);
    }
    /**
     * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
     *   by quering available chain/contract storage and reconstructing events.
     *
     * NOTE: throws on error! Make sure to wrap in try/catch!
     */
    async fetch() {
        this._currentBlock = (await this._api.tm.block()).block.header.height;
        this.log.info(`Current block: ${this._currentBlock}.`);
        if (!this._currentBlock) {
            this.log.error(`Failed to fetch current block! Aborting fetch.`);
            return [];
        }
        this.log.info(`Starting paginated proposals query...`);
        const proposals = await this._getAllPaginated((key) => this._api.lcd.gov.proposals(0, '', '', key), 'proposals');
        const proposalEvents = [];
        for (const proposal of proposals) {
            const events = await this._proposalToEvents(proposal);
            proposalEvents.push(...events);
        }
        return proposalEvents;
    }
}
exports.StorageFetcher = StorageFetcher;
