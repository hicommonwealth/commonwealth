import type { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import type { QueryProposalsResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query';

import type { CWEvent } from '../../interfaces';
import { IStorageFetcher, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import type { IEventData, Api, ISubmitProposal } from './types';
import { EventKind, coinToCoins } from './types';

const dateToUnix = (d?: Date): number | undefined => {
  if (d) return Math.floor(d.getTime() / 1000);
  return undefined;
};

export class StorageFetcher extends IStorageFetcher<Api> {
  private readonly log;

  constructor(protected readonly _api: Api, origin?: string) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Cosmos, origin])
    );
  }

  private _currentBlock: number;

  // Gets all items from a particular paginated cosmos request keyed by "key", using
  // the standard pagination system.
  // TODO: throttling to get around endpoint limits?
  private async _getAllPaginated<
    U,
    T extends { pagination?: { nextKey: Uint8Array } }
  >(func: (nextKey?: Uint8Array) => Promise<T>, key: string): Promise<U[]> {
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

  private async _proposalToEvents(
    proposal: Proposal
  ): Promise<CWEvent<IEventData>[]> {
    const events: CWEvent<IEventData>[] = [];

    // NOTE: we cannot query the actual submission block
    const submitEvent: CWEvent<ISubmitProposal> = {
      blockNumber: this._currentBlock,
      network: SupportedNetwork.Cosmos,
      data: {
        kind: EventKind.SubmitProposal,
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
        totalDeposit:
          proposal.totalDeposit && coinToCoins(proposal.totalDeposit),
      },
    };
    events.push(submitEvent);

    /* JAKE 12/16: voting disabled for time being
    if (proposal.status === ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD) {
      // query deposit events if active
      this.log.info(`Starting paginated deposits query...`);
      const deposits = await this._getAllPaginated<
        Deposit,
        QueryDepositsResponse
      >(
        (key) => this._api.lcd.gov.deposits(proposal.proposalId, key),
        'deposits'
      );
      const depositEvents: CWEvent<IDeposit>[] = deposits.map((d) => ({
        blockNumber: this._currentBlock,
        network: SupportedNetwork.Cosmos,
        data: {
          kind: EventKind.Deposit,
          id: proposal.proposalId.toString(10),
          depositor: d.depositor,
          amount: coinToCoins(d.amount),
        },
      }));
      events.push(...depositEvents);
    } else if (
      proposal.status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD
    ) {
      // query voting events if active
      this.log.info(`Starting paginated votes query...`);
      const votes = await this._getAllPaginated<Vote, QueryVotesResponse>(
        (key) => this._api.lcd.gov.votes(proposal.proposalId, key),
        'votes'
      );
      const voteEvents: CWEvent<IVote>[] = votes.map((v) => ({
        blockNumber: this._currentBlock,
        network: SupportedNetwork.Cosmos,
        data: {
          kind: EventKind.Vote,
          id: proposal.proposalId.toString(10),
          voter: v.voter,
          option: v.option,
        },
      }));
      events.push(...voteEvents);
    } */
    return events;
  }

  public async fetchOne(id: string): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = (await this._api.tm.block()).block.header.height;
    this.log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      this.log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    const { proposal } = await this._api.rpc.gov.proposal(id);
    return this._proposalToEvents(proposal);
  }

  /**
   * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
   *   by quering available chain/contract storage and reconstructing events.
   *
   * NOTE: throws on error! Make sure to wrap in try/catch!
   */
  public async fetch(): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = (await this._api.tm.block()).block.header.height;
    this.log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      this.log.error(`Failed to fetch current block! Aborting fetch.`);
      return [];
    }

    this.log.info(`Starting paginated proposals query...`);
    const proposals = await this._getAllPaginated<
      Proposal,
      QueryProposalsResponse
    >((key) => this._api.rpc.gov.proposals(0, '', '', key), 'proposals');
    const proposalEvents = [];
    for (const proposal of proposals) {
      const events = await this._proposalToEvents(proposal);
      proposalEvents.push(...events);
    }
    return proposalEvents;
  }
}
