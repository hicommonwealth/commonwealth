import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import { Enrich } from './filters/enricher';
import {
  IEventData,
  EventKind,
  Api,
  IVoteCast,
  IProposalCreated,
  IProposalCanceled,
  IProposalQueued,
  IProposalExecuted,
  isGovernorAlpha,
} from './types';

const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(protected readonly _api: Api) {
    super(_api);
  }

  private _currentBlock: number;

  public async fetchOne(id: string): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = +(await this._api.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
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
  public async fetch(
    range?: IDisconnectedRange
  ): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = await this._api.provider.getBlockNumber();
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // populate range fully if not given
    if (!range) {
      range = { startBlock: 0 };
    } else if (!range.startBlock) {
      range.startBlock = 0;
    } else if (range.startBlock >= this._currentBlock) {
      log.error(
        `Start block ${range.startBlock} greater than current block ${this._currentBlock}!`
      );
      return [];
    }
    if (range.endBlock && range.startBlock >= range.endBlock) {
      log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
      return [];
    }
    log.info(
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
      range.endBlock || 'latest'
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
      range.endBlock || 'latest'
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

    // Bravo does not have queued events
    let queuedCwEvents: CWEvent<IProposalQueued>[] = [];
    if (isGovernorAlpha(this._api)) {
      const proposalQueuedEvents = await this._api.queryFilter(
        this._api.filters.ProposalQueued(null, null),
        range.startBlock,
        range.endBlock || 'latest'
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
    }
    const proposalCanceledEvents = await this._api.queryFilter(
      this._api.filters.ProposalCanceled(null),
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
            evt
          ) as Promise<CWEvent<IProposalCanceled>>
      )
    );
    const proposalExecutedEvents = await this._api.queryFilter(
      this._api.filters.ProposalExecuted(null),
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
