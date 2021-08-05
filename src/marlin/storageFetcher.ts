import EthDater from 'ethereum-block-by-date';

import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import log from '../logging';

import { IEventData, EventKind, Api, Proposal } from './types';

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(protected readonly _api: Api, private readonly _dater: EthDater) {
    super(_api);
  }

  private _currentBlock: number;

  private async _eventsFromProposal(
    index: number,
    proposal: Proposal,
    startBlock: number
  ): Promise<CWEvent<IEventData>[]> {
    // Only GovernorAlpha events are on Proposals
    const events: CWEvent<IEventData>[] = [];
    // All proposals had to have at least been created
    // TODO: fetch these from events rather than storage
    const createdEvent: CWEvent<IEventData> = {
      blockNumber: startBlock,
      data: {
        kind: EventKind.ProposalCreated,
        id: index,
        proposer: proposal.proposer,
        targets: [], // TODO: not on proposal...
        values: [], // TODO: not on proposal...
        signatures: [], //  TODO: not on proposal...
        calldatas: [], //  TODO: not on proposal...
        startBlock,
        endBlock: +proposal.endBlock,
        description: '', // TODO: not on proposal...
      },
    };
    events.push(createdEvent);
    // Some proposals might have been canceled too
    if (proposal.canceled) {
      const canceledEvent: CWEvent<IEventData> = {
        blockNumber: Math.min(this._currentBlock, +proposal.endBlock),
        data: {
          kind: EventKind.ProposalCanceled,
          id: +proposal.id,
        },
      };
      events.push(canceledEvent);
    }
    // ProposalQueued
    if ((await this._api.governorAlpha.state(proposal.id)) === 5) {
      // state 5 is queued
      const queuedEvent: CWEvent<IEventData> = {
        blockNumber: Math.min(this._currentBlock, +proposal.endBlock),
        data: {
          kind: EventKind.ProposalQueued,
          id: +proposal.id,
          eta: +proposal.eta,
        },
      };
      events.push(queuedEvent);
    }
    // ProposalExecuted
    if ((await this._api.governorAlpha.state(proposal.id)) === 7) {
      // state 7 is executed
      const proposalExecuted: CWEvent<IEventData> = {
        blockNumber: Math.min(this._currentBlock, +proposal.endBlock),
        data: {
          kind: EventKind.ProposalExecuted,
          id: +proposal.id,
        },
      };
      events.push(proposalExecuted);
    }
    // Vote Cast events are unfetchable
    return events;
  }

  public async fetchOne(id: string): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = +(await this._api.governorAlpha.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    const proposal: Proposal = await this._api.governorAlpha.proposals(id);
    if (+proposal.id === 0) {
      log.error(`Marlin proposal ${id} not found.`);
      return [];
    }

    const events = await this._eventsFromProposal(
      proposal.id.toNumber(),
      proposal,
      +proposal.startBlock
    );
    return events;
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
    this._currentBlock = +(await this._api.governorAlpha.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // populate range fully if not given
    if (!range) {
      range = { startBlock: 0, endBlock: this._currentBlock };
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
    if (!range.endBlock) {
      range.endBlock = this._currentBlock;
    }
    log.info(
      `Fetching Marlin entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    const queueLength = +(await this._api.governorAlpha.proposalCount());
    const results: CWEvent<IEventData>[] = [];

    let nFetched = 0;
    for (let i = 0; i < queueLength; i++) {
      // work backwards through the queue, starting with the most recent
      const queuePosition = queueLength - i;
      const proposal: Proposal = await this._api.governorAlpha.proposals(
        queuePosition
      );
      // fetch actual proposal
      log.debug(`Fetched Marlin proposal ${proposal.id} from storage.`);
      const startBlock = +proposal.startBlock;

      if (startBlock >= range.startBlock && startBlock <= range.endBlock) {
        const events = await this._eventsFromProposal(
          proposal.id.toNumber(),
          proposal,
          startBlock
        );
        results.push(...events);
        nFetched += 1;

        // halt fetch once we find a completed/executed proposal in order to save data
        // we may want to run once without this, in order to fetch backlog, or else develop a pagination
        // strategy, but for now our API usage is limited.
        if (
          !fetchAllCompleted &&
          events.find((p) => p.data.kind === EventKind.ProposalExecuted)
        ) {
          log.debug(
            `Proposal ${proposal.id} is marked as executed, halting fetch.`
          );
          break;
        }
        if (range.maxResults && nFetched >= range.maxResults) {
          log.debug(`Fetched ${nFetched} proposals, halting fetch.`);
          break;
        }
      } else if (startBlock < range.startBlock) {
        log.debug(
          `Marlin proposal start block (${startBlock}) is before ${range.startBlock}, ending fetch.`
        );
        break;
      } else if (startBlock > range.endBlock) {
        // keep walking backwards until within range
        log.debug(
          `Marlin proposal start block (${startBlock}) is after ${range.endBlock}, ending fetch.`
        );
      }
    }
    return results;
  }
}
