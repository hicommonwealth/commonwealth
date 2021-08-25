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
    range?: IDisconnectedRange,
    fetchAllCompleted = false
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

    // sort in descending order (newest first)
    proposalCreatedEvents.sort((a, b) => b.blockNumber - a.blockNumber);
    log.info(`Found ${proposalCreatedEvents.length} proposals!`);

    const voteCastEvents = await this._api.queryFilter(
      this._api.filters.VoteCast(null, null, null, null),
      range.startBlock,
      range.endBlock || 'latest'
    );
    const proposalQueuedEvents = await this._api.queryFilter(
      this._api.filters.ProposalQueued(null, null),
      range.startBlock,
      range.endBlock || 'latest'
    );
    const proposalCanceledEvents = await this._api.queryFilter(
      this._api.filters.ProposalCanceled(null),
      range.startBlock,
      range.endBlock || 'latest'
    );
    const proposalExecutedEvents = await this._api.queryFilter(
      this._api.filters.ProposalExecuted(null),
      range.startBlock,
      range.endBlock || 'latest'
    );

    const proposals = await Promise.all(
      proposalCreatedEvents.map(async (p) => {
        const createdEvent = (await Enrich(
          this._api,
          p.blockNumber,
          EventKind.ProposalCreated,
          p
        )) as CWEvent<IProposalCreated>;
        const voteRawEvents = voteCastEvents.filter(
          (v) => +v.args.proposalId === createdEvent.data.id
        );
        const voteEvents = await Promise.all(
          voteRawEvents.map(
            (evt) =>
              Enrich(
                this._api,
                evt.blockNumber,
                EventKind.VoteCast,
                evt
              ) as Promise<CWEvent<IVoteCast>>
          )
        );
        const proposalEvents: CWEvent<IEventData>[] = [
          createdEvent,
          ...voteEvents,
        ];
        const cancelledRawEvent = proposalCanceledEvents.find(
          (evt) => +evt.args.id === createdEvent.data.id
        );
        if (cancelledRawEvent) {
          const cancelledEvent = (await Enrich(
            this._api,
            cancelledRawEvent.blockNumber,
            EventKind.ProposalCanceled,
            cancelledRawEvent
          )) as CWEvent<IProposalCanceled>;
          proposalEvents.push(cancelledEvent);
        }
        const queuedRawEvent = proposalQueuedEvents.find(
          (evt) => +evt.args.id === createdEvent.data.id
        );
        if (queuedRawEvent) {
          const queuedEvent = (await Enrich(
            this._api,
            queuedRawEvent.blockNumber,
            EventKind.ProposalQueued,
            queuedRawEvent
          )) as CWEvent<IProposalQueued>;
          proposalEvents.push(queuedEvent);
        }
        const executedRawEvent = proposalExecutedEvents.find(
          (evt) => +evt.args.id === createdEvent.data.id
        );
        if (executedRawEvent) {
          const executedEvent = (await Enrich(
            this._api,
            executedRawEvent.blockNumber,
            EventKind.ProposalExecuted,
            executedRawEvent
          )) as CWEvent<IProposalQueued>;
          proposalEvents.push(executedEvent);
        }
        return proposalEvents;
      })
    );

    if (range.maxResults) {
      return proposals.slice(0, range.maxResults).flat();
    }
    return proposals.flat();
  }
}
