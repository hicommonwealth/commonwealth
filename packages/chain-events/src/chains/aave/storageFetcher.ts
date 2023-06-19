import { populateRange } from '../../util';
import type { CWEvent, IDisconnectedRange } from '../../interfaces';
import { IStorageFetcher, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { Enrich } from './filters/enricher';
import type {
  Api,
  IProposalCreated,
  IProposalCanceled,
  IProposalQueued,
  IProposalExecuted,
  IVoteEmitted,
} from './types';
import { EventKind } from './types';

type IEntityEventData =
  | IProposalCanceled
  | IProposalCreated
  | IProposalExecuted
  | IProposalQueued
  | IVoteEmitted;

export class StorageFetcher extends IStorageFetcher<Api> {
  protected readonly log;

  protected readonly chain;

  constructor(protected readonly _api: Api, chain?: string) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Aave, chain])
    );
    this.chain = chain;
  }

  private _currentBlock: number;

  public async fetchOne(id: string): Promise<CWEvent<IEntityEventData>[]> {
    this._currentBlock =
      +(await this._api.governance.provider.getBlockNumber());
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
  public async fetch(
    range?: IDisconnectedRange
  ): Promise<CWEvent<IEntityEventData>[]> {
    this._currentBlock = await this._api.governance.provider.getBlockNumber();
    this.log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      this.log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    range = populateRange(range, this._currentBlock);
    this.log.info(
      `Fetching Aave entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    const proposalCreatedEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.ProposalCreated(
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ),
      range.startBlock,
      range.endBlock
    );
    const createdCwEvents = await Promise.all(
      proposalCreatedEvents.map((evt) => {
        try {
          return Enrich(
            evt.blockNumber,
            EventKind.ProposalCreated,
            evt
          ) as Promise<CWEvent<IProposalCreated>>;
        } catch (e) {
          this.log.error(
            `Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${EventKind.ProposalCreated}, Error Message: ${e.message}`
          );
          // maintain previous functionality of throwing
          throw new Error(e.message);
        }
      })
    );
    const voteEmittedEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.VoteEmitted(null, null, null, null),
      range.startBlock,
      range.endBlock
    );
    const voteCwEvents = await Promise.all(
      voteEmittedEvents.map((evt) => {
        try {
          return Enrich(evt.blockNumber, EventKind.VoteEmitted, evt) as Promise<
            CWEvent<IVoteEmitted>
          >;
        } catch (e) {
          this.log.error(
            `Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${EventKind.VoteEmitted}, Error Message: ${e.message}`
          );
          // maintain previous functionality of throwing
          throw new Error(e.message);
        }
      })
    );
    const proposalQueuedEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.ProposalQueued(null, null, null),
      range.startBlock,
      range.endBlock
    );
    const queuedCwEvents = await Promise.all(
      proposalQueuedEvents.map((evt) => {
        try {
          return Enrich(
            evt.blockNumber,
            EventKind.ProposalQueued,
            evt
          ) as Promise<CWEvent<IProposalQueued>>;
        } catch (e) {
          this.log.error(
            `Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${EventKind.ProposalQueued}, Error Message: ${e.message}`
          );
          // maintain previous functionality of throwing
          throw new Error(e.message);
        }
      })
    );
    const proposalCanceledEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.ProposalCanceled(null),
      range.startBlock,
      range.endBlock
    );
    const cancelledCwEvents = await Promise.all(
      proposalCanceledEvents.map((evt) => {
        try {
          return Enrich(
            evt.blockNumber,
            EventKind.ProposalCanceled,
            evt
          ) as Promise<CWEvent<IProposalCanceled>>;
        } catch (e) {
          this.log.error(
            `Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${EventKind.ProposalCanceled}, Error Message: ${e.message}`
          );
          // maintain previous functionality of throwing
          throw new Error(e.message);
        }
      })
    );
    const proposalExecutedEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.ProposalExecuted(null, null),
      range.startBlock,
      range.endBlock
    );
    const executedCwEvents = await Promise.all(
      proposalExecutedEvents.map((evt) => {
        try {
          return Enrich(
            evt.blockNumber,
            EventKind.ProposalExecuted,
            evt
          ) as Promise<CWEvent<IProposalExecuted>>;
        } catch (e) {
          this.log.error(
            `Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${EventKind.ProposalExecuted}, Error Message: ${e.message}`
          );
          // maintain previous functionality of throwing
          throw new Error(e.message);
        }
      })
    );
    return [
      ...createdCwEvents,
      ...voteCwEvents,
      ...queuedCwEvents,
      ...cancelledCwEvents,
      ...executedCwEvents,
    ].sort((e1, e2) => e1.blockNumber - e2.blockNumber);
  }
}
