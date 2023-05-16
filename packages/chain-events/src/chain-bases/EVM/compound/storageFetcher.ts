import { populateRange } from '../../../util';
import type { CWEvent, IDisconnectedRange } from '../../../interfaces';
import { IStorageFetcher, SupportedNetwork } from '../../../interfaces';
import { addPrefix, factory } from '../../../logging';

import { Enrich } from './filters/enricher';
import type {
  IEventData,
  Api,
  IVoteCast,
  IProposalCreated,
  IProposalCanceled,
  IProposalQueued,
  IProposalExecuted,
} from './types';
import { EventKind, isGovernorAlpha } from './types';

export class StorageFetcher extends IStorageFetcher<Api> {
  private readonly log;

  constructor(protected readonly _api: Api, chain?: string) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Compound, chain])
    );
  }

  private _currentBlock: number;

  public async fetchOne(id: string): Promise<CWEvent<IEventData>[]> {
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
  public async fetch(
    range?: IDisconnectedRange
  ): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = await this._api.provider.getBlockNumber();
    this.log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      this.log.error(`Failed to fetch current block! Aborting fetch.`);
      return [];
    }

    range = populateRange(range, this._currentBlock);
    this.log.info(
      `Fetching Compound entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    const proposalCreatedEvents = await this._api.queryFilter(
      this._api.filters.ProposalCreated(
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
      proposalCreatedEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.ProposalCreated,
            evt
          ) as Promise<CWEvent<IProposalCreated>>
      )
    );
    const voteCastEvents = await this._api.queryFilter(
      isGovernorAlpha(this._api)
        ? this._api.filters.VoteCast(null, null, null, null)
        : this._api.filters.VoteCast(null, null, null, null, null),
      range.startBlock,
      range.endBlock
    );
    const voteCwEvents = await Promise.all(
      voteCastEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.VoteCast,
            evt
          ) as Promise<CWEvent<IVoteCast>>
      )
    );

    let queuedCwEvents = [];
    try {
      const proposalQueuedEvents = await this._api.queryFilter(
        this._api.filters.ProposalQueued(null, null),
        range.startBlock,
        range.endBlock
      );
      queuedCwEvents = await Promise.all(
        proposalQueuedEvents.map(
          (evt) =>
            Enrich(
              this._api,
              evt.blockNumber,
              EventKind.ProposalQueued,
              evt
            ) as Promise<CWEvent<IProposalQueued>>
        )
      );
    } catch (e) {
      this.log.warn('Could not fetched queued events.');
    }
    const proposalCanceledEvents = await this._api.queryFilter(
      this._api.filters.ProposalCanceled(null),
      range.startBlock,
      range.endBlock
    );
    const cancelledCwEvents = await Promise.all(
      proposalCanceledEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.ProposalCanceled,
            evt
          ) as Promise<CWEvent<IProposalCanceled>>
      )
    );
    const proposalExecutedEvents = await this._api.queryFilter(
      this._api.filters.ProposalExecuted(null),
      range.startBlock,
      range.endBlock
    );
    const executedCwEvents = await Promise.all(
      proposalExecutedEvents.map(
        (evt) =>
          Enrich(
            this._api,
            evt.blockNumber,
            EventKind.ProposalExecuted,
            evt
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
