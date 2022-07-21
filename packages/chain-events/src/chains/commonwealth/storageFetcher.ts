import {
  CWEvent,
  IStorageFetcher,
  IDisconnectedRange,
  SupportedNetwork,
} from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { Enrich } from './filters/enricher';
import {
  EventKind,
  Api,
  IProjectCreated,
  IProjectCurated,
  IProjectBacked,
  IProjectFailed,
  IProjectSucceeded,
  IProjectWithdraw,
  RawEvent,
} from './types';

type IEntityEventData =
  | IProjectCreated
  | IProjectCurated
  | IProjectBacked
  | IProjectFailed
  | IProjectSucceeded
  | IProjectWithdraw;

export class StorageFetcher extends IStorageFetcher<Api> {
  protected readonly log;

  protected readonly chain;

  constructor(protected readonly _api: Api, chain?: string) {
    super(_api);
    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Commonwealth, chain])
    );
    this.chain = chain;
  }

  private _currentBlock: number;

  public async fetchOne(id: string): Promise<CWEvent<IEntityEventData>[]> {
    this._currentBlock = +(await this._api.factory.provider.getBlockNumber());
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
   */
  public async fetch(
    range?: IDisconnectedRange
  ): Promise<CWEvent<IEntityEventData>[]> {
    this._currentBlock = await this._api.factory.provider.getBlockNumber();
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
    if (!range.endBlock) {
      range.endBlock = this._currentBlock;
    }
    if (range.startBlock >= range.endBlock) {
      this.log.error(
        `Invalid fetch range: ${range.startBlock}-${range.endBlock}.`
      );
      return [];
    }
    this.log.info(
      `Fetching Commonwealth entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    const fetchEvents = async <T extends IEntityEventData>(
      filterCall: () => Promise<RawEvent[]>,
      eventKind: EventKind
    ): Promise<CWEvent<T>[]> => {
      const events = await filterCall();
      return Promise.all(
        events.map((evt) => {
          try {
            return Enrich(
              this._api,
              evt.blockNumber,
              eventKind,
              evt
            ) as Promise<CWEvent<T>>;
          } catch (e) {
            this.log.error(
              `Failed to enrich event. Block number: ${evt.blockNumber}, Name/Kind: ${eventKind}, Error Message: ${e.message}`
            );
            // maintain previous functionality of throwing
            throw new Error(e.message);
          }
        })
      );
    };

    // fetch factory events
    const projectCreatedEvents = await fetchEvents<IProjectCreated>(() => {
      return this._api.factory.queryFilter(
        this._api.factory.filters.ProjectCreated(null, null),
        range.startBlock,
        range.endBlock
      );
    }, EventKind.ProjectCreated);

    // fetch events on individual projects
    const projectEvents = [];
    for (const project of this._api.projects) {
      const backedEvents = await fetchEvents<IProjectBacked>(() => {
        return project.project.queryFilter(
          project.project.filters.Back(null, null, null),
          range.startBlock,
          range.endBlock
        );
      }, EventKind.ProjectBacked);
      const curateEvents = await fetchEvents<IProjectCurated>(() => {
        return project.project.queryFilter(
          project.project.filters.Curate(null, null, null),
          range.startBlock,
          range.endBlock
        );
      }, EventKind.ProjectCurated);
      const successEvents = await fetchEvents<IProjectSucceeded>(() => {
        return project.project.queryFilter(
          project.project.filters.Succeeded(null, null),
          range.startBlock,
          range.endBlock
        );
      }, EventKind.ProjectSucceeded);
      const failureEvents = await fetchEvents<IProjectFailed>(() => {
        return project.project.queryFilter(
          project.project.filters.Failed(),
          range.startBlock,
          range.endBlock
        );
      }, EventKind.ProjectFailed);
      const withdrawEvents = await fetchEvents<IProjectWithdraw>(() => {
        return project.project.queryFilter(
          project.project.filters.Withdraw(null, null, null, null),
          range.startBlock,
          range.endBlock
        );
      }, EventKind.ProjectWithdraw);
      projectEvents.push(
        ...backedEvents,
        ...curateEvents,
        ...successEvents,
        ...failureEvents,
        ...withdrawEvents
      );
    }

    return [...projectCreatedEvents, ...projectEvents].sort(
      (e1, e2) => e1.blockNumber - e2.blockNumber
    );
  }
}
