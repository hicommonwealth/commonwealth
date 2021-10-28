import {
  CWEvent,
  IStorageFetcher,
  IDisconnectedRange,
  SupportedNetwork,
} from '../../interfaces';
import { addPrefix, factory, formatFilename } from '../../logging';

import { Enrich } from './filters/enricher';
import {
  EventKind,
  Api,
  IProposalCreated,
  IProposalCanceled,
  IProposalQueued,
  IProposalExecuted,
  IVoteEmitted,
} from './types';

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
  public async fetch(
    range?: IDisconnectedRange
  ): Promise<CWEvent<IEntityEventData>[]> {
    this._currentBlock = await this._api.governance.provider.getBlockNumber();
    this.log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      this.log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // populate range fully if not given
    if (!range) {
      range = { startBlock: 0 };
    } else if (!range.startBlock) {
      range.startBlock = 0;
    } else if (range.startBlock >= this._currentBlock) {
      this.log.error(
        `Start block ${range.startBlock} greater than current block ${this._currentBlock}!`
      );
      return [];
    }
    if (range.endBlock && range.startBlock >= range.endBlock) {
      this.log.error(
        `Invalid fetch range: ${range.startBlock}-${range.endBlock}.`
      );
      return [];
    }
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
      range.endBlock || 'latest'
    );
    const createdCwEvents = await Promise.all(
      proposalCreatedEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.ProposalCreated,
            evt,
            this.chain
          ) as Promise<CWEvent<IProposalCreated>>
      )
    );
    const voteEmittedEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.VoteEmitted(null, null, null, null),
      range.startBlock,
      range.endBlock || 'latest'
    );
    const voteCwEvents = await Promise.all(
      voteEmittedEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.VoteEmitted,
            evt,
            this.chain
          ) as Promise<CWEvent<IVoteEmitted>>
      )
    );
    const proposalQueuedEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.ProposalQueued(null, null, null),
      range.startBlock,
      range.endBlock || 'latest'
    );
    const queuedCwEvents = await Promise.all(
      proposalQueuedEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.ProposalQueued,
            evt,
            this.chain
          ) as Promise<CWEvent<IProposalQueued>>
      )
    );
    const proposalCanceledEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.ProposalCanceled(null),
      range.startBlock,
      range.endBlock || 'latest'
    );
    const cancelledCwEvents = await Promise.all(
      proposalCanceledEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.ProposalCanceled,
            evt,
            this.chain
          ) as Promise<CWEvent<IProposalCanceled>>
      )
    );
    const proposalExecutedEvents = await this._api.governance.queryFilter(
      this._api.governance.filters.ProposalExecuted(null, null),
      range.startBlock,
      range.endBlock || 'latest'
    );
    const executedCwEvents = await Promise.all(
      proposalExecutedEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.ProposalExecuted,
            evt,
            this.chain
          ) as Promise<CWEvent<IProposalExecuted>>
      )
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
