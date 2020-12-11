import EthDater from 'ethereum-block-by-date';

import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import { IEventData, EventKind, Api, Proposal } from './types';
import { MPond } from './contractTypes/MPond';
import { GovernorAlpha } from './contractTypes/GovernorAlpha';
import { Timelock } from './contractTypes/Timelock';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(protected readonly _api: Api, private readonly _dater: EthDater) {
    super(_api);
  }

  private _votingPeriod: number; // The duration of voting on a proposal, in blocks
  private _votingDelay: number; // The delay before voting on a proposal may take place, once proposed
  private _currentBlock: number;
  private _currentTimestamp: number;

  private async _eventsFromProposal(
    index: number,
    proposal: Proposal,
    startTime: number,
    startBlock: number,
  ): Promise<CWEvent<IEventData>[]> {
    // Only GovernorAlpha events are on Proposals
    const events: CWEvent<IEventData>[] = [];
    // All proposals had to have at least been created
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
        startBlock: startBlock,
        endBlock: proposal.endBlock.toNumber(),
        description: '', // TODO: not on proposal...
      }
    };
    events.push(createdEvent);
    // Some proposals might have been canceled too
    if (proposal.canceled) {
      const canceledEvent: CWEvent<IEventData> = {
        blockNumber: proposal.endBlock.toNumber(),
        data: {
          kind: EventKind.ProposalCanceled,
          id: proposal.id.toNumber(),
        }
      };
      events.push(canceledEvent);
    } 
    // ProposalQueued
    if (await this._api.governorAlpha.state(proposal.id) === 5) { // state 5 is queued
      const queuedEvent: CWEvent<IEventData> = {
        blockNumber: proposal.endBlock.toNumber(),
        data: {
          kind: EventKind.ProposalQueued,
          id: proposal.id.toNumber(),
          eta: proposal.eta.toNumber(),
        }
      };
      events.push(queuedEvent);
    }
    // ProposalExecuted
    if (await this._api.governorAlpha.state(proposal.id) === 7) { // state 7 is executed
      const proposalExecuted: CWEvent<IEventData> = {
        blockNumber: proposal.endBlock.toNumber(),
        data: {
          kind: EventKind.ProposalExecuted,
          id: proposal.id.toNumber(),
        }
      };
      events.push(proposalExecuted);
    }
    // Vote Cast events are unfetchable
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
  public async fetch(range?: IDisconnectedRange, fetchAllCompleted = false): Promise<CWEvent<IEventData>[]> {
    // we need to fetch a few constants to convert voting periods into blocks
    this._votingDelay = +(await this._api.governorAlpha.votingDelay());
    this._votingPeriod = +(await this._api.governorAlpha.votingPeriod())
    this._currentBlock = +(await this._api.governorAlpha.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    this._currentTimestamp = (await this._api.governorAlpha.provider.getBlock(this._currentBlock)).timestamp;
    log.info(`Current timestamp: ${this._currentTimestamp}.`);
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
      log.error(`Start block ${range.startBlock} greater than current block ${this._currentBlock}!`);
      return [];
    }
    if (range.endBlock && range.startBlock >= range.endBlock) {
      log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
      return [];
    } else if (!range.endBlock) {
      range.endBlock = this._currentBlock;
    }
    log.info(`Fetching Marlin entities for range: ${range.startBlock}-${range.endBlock}.`);

    const queueLength = +(await this._api.governorAlpha.proposalCount());
    const results: CWEvent<IEventData>[] = [];

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < queueLength; i++) {
      // work backwards through the queue, starting with the most recent
      const queuePosition = queueLength - i - 1;
      const proposal: Proposal = await this._api.governorAlpha.proposals(queuePosition);
      // fetch actual proposal
      // const proposal: Proposal = await this._api.governorAlpha.proposalQueue(proposalIndex);
      log.debug(`Fetched Marlin proposal ${proposal.id} from storage.`);

      // compute starting time and derive closest block number
      const startingPeriod = +proposal.startBlock;
      const proposalStartingTime = (startingPeriod * this._votingPeriod) + this._currentBlock;
      log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
      let proposalStartBlock: number;
      try {
        const block = await this._dater.getDate(proposalStartingTime * 1000);
        proposalStartBlock = block.block;
        log.debug(`For timestamp ${block.date}, fetched ETH block #${block.block}.`);
      } catch (e) {
        log.error(`Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`);
        log.error('Skipping proposal event fetch.');
        // eslint-disable-next-line no-continue
        continue;
      }
      if (proposalStartBlock >= range.startBlock && proposalStartBlock <= range.endBlock) {
        const events = await this._eventsFromProposal(
          proposal.id.toNumber(),
          proposal,
          proposalStartingTime,
          proposalStartBlock
        );
        results.push(...events);

        // halt fetch once we find a completed/executed proposal in order to save data
        // we may want to run once without this, in order to fetch backlog, or else develop a pagination
        // strategy, but for now our API usage is limited.
        if (!fetchAllCompleted && events.find((p) => p.data.kind === EventKind.ProposalExecuted)) {
          log.debug(`Proposal ${proposal.id} is marked as executed, halting fetch.`);
          break;
        }
      } else if (proposalStartBlock < range.startBlock) {
        log.debug(`Marlin proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`);
        break;
      } else if (proposalStartBlock > range.endBlock) {
        // keep walking backwards until within range
        log.debug(`Marlin proposal start block (${proposalStartBlock}) is after ${range.endBlock}, ending fetch.`);
      }
    }
    return results;
  }
}