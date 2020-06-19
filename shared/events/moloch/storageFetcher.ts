import EthDater from 'ethereum-block-by-date';

import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import { IMolochEventData, MolochEventKind, MolochApi, Moloch1Proposal, Moloch2Proposal } from './types';
import { Moloch1 } from '../../../eth/types/Moloch1';
import { Moloch2 } from '../../../eth/types/Moloch2';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IStorageFetcher<MolochApi> {
  constructor(protected readonly _api: MolochApi, private readonly _version: 1 | 2, private readonly _dater: EthDater) {
    super(_api);
  }

  private _periodDuration: number;     // 1 period in seconds
  private _summoningTime: number;      // starting time of contract
  private _abortPeriod: number;
  private _votingPeriod: number;
  private _gracePeriod: number;
  private _currentBlock: number;
  private _currentTimestamp: number;

  private _isMoloch1Proposal(m: Moloch1Proposal | Moloch2Proposal): m is Moloch1Proposal {
    return this._version === 1;
  }

  private async _eventsFromProposal(
    index: number,
    proposal: Moloch1Proposal | Moloch2Proposal,
    startTime: number,
    startBlock: number,
  ): Promise<CWEvent<IMolochEventData>[]> {
    const events: CWEvent<IMolochEventData>[] = [ ];
    if (this._isMoloch1Proposal(proposal)) {
      const proposedEvent: CWEvent<IMolochEventData> = {
        blockNumber: startBlock,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: index,
          member: proposal.proposer,
          applicant: proposal.applicant,
          tokenTribute: proposal.tokenTribute.toString(),
          sharesRequested: proposal.sharesRequested.toString(),
          details: proposal.details,
          startTime,
        }
      };
      events.push(proposedEvent);
      if (proposal.aborted) {
        // derive block # from abort time
        const maximalAbortTime = Math.min(
          this._currentTimestamp,
          (startTime + (this._abortPeriod * this._periodDuration)) * 1000
        );
        let blockNumber;
        if (maximalAbortTime === this._currentTimestamp) {
          log.info('Still in abort window, using current timestamp.');
          blockNumber = this._currentBlock;
        } else {
          log.info(`Passed abort window, fetching timestamp ${maximalAbortTime}`);
          try {
            const abortBlock = await this._dater.getDate(maximalAbortTime);
            blockNumber = abortBlock.block;
          } catch (e) {
            // fake it if we can't fetch it
            log.error(`Unable to fetch abort block from timestamp ${maximalAbortTime}: ${e.message}.`);
            blockNumber = startBlock + 1;
          }
        }

        const abortedEvent: CWEvent<IMolochEventData> = {
          blockNumber,
          data: {
            kind: MolochEventKind.Abort,
            proposalIndex: index,
            applicant: proposal.applicant,
          }
        };
        events.push(abortedEvent);
      } else if (proposal.processed) {
        // derive block # from process time
        const minimalProcessTime = startTime + ((this._votingPeriod + this._gracePeriod) * this._periodDuration);
        log.info(`Fetching minimum processed block at time ${minimalProcessTime}.`);
        let blockNumber;
        try {
          const processedBlock = await this._dater.getDate(minimalProcessTime * 1000);
          blockNumber = processedBlock.block;
        } catch (e) {
          // fake it if we can't fetch it
          log.error(`Unable to fetch processed block from timestamp ${minimalProcessTime}: ${e.message}.`);
          blockNumber = startBlock + 2;
        }

        const processedEvent: CWEvent<IMolochEventData> = {
          blockNumber,
          data: {
            kind: MolochEventKind.ProcessProposal,
            proposalIndex: index,
            applicant: proposal.applicant,
            member: proposal.proposer,
            tokenTribute: proposal.tokenTribute.toString(),
            sharesRequested: proposal.sharesRequested.toString(),
            didPass: proposal.didPass,
            yesVotes: proposal.yesVotes.toString(),
            noVotes: proposal.noVotes.toString(),
          }
        };
        events.push(processedEvent);
      }
    } else {
      // TODO: Moloch2
      return [];
    }
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
  public async fetch(range?: IDisconnectedRange): Promise<CWEvent<IMolochEventData>[]> {
    // we need to fetch a few constants to convert voting periods into blocks
    this._periodDuration = +(await this._api.periodDuration());
    this._summoningTime = +(await this._api.summoningTime());
    this._votingPeriod = +(await this._api.votingPeriodLength());
    this._gracePeriod = +(await this._api.gracePeriodLength());
    this._abortPeriod = +(await this._api.abortWindow());
    this._currentBlock = +(await this._api.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    this._currentTimestamp = (await this._api.provider.getBlock(this._currentBlock)).timestamp;
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
    log.info(`Fetching Moloch entities for range: ${range.startBlock}-${range.endBlock}.`);

    const queueLength = +(await this._api.getProposalQueueLength());
    const results: CWEvent<IMolochEventData>[] = [];

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < queueLength; i++) {
      // work backwards through the queue, starting with the most recent
      const queuePosition = queueLength - i - 1;
      const proposalIndex = this._version === 1
        ? queuePosition
        : +(await (this._api as Moloch2).proposalQueue(queuePosition));

      // fetch actual proposal
      const proposal: Moloch1Proposal | Moloch2Proposal = this._version === 1
        ? await this._api.proposalQueue(proposalIndex)
        : await this._api.proposals(proposalIndex);
      log.debug(`Fetched Moloch proposal ${proposalIndex} from storage.`);

      // compute starting time and derive closest block number
      const startingPeriod = +proposal.startingPeriod;
      const proposalStartingTime = (startingPeriod * this._periodDuration) + this._summoningTime;
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
          proposalIndex,
          proposal,
          proposalStartingTime,
          proposalStartBlock
        );
        results.push(...events);
      } else if (proposalStartBlock < range.startBlock) {
        log.debug(`Moloch proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`);
        break;
      } else if (proposalStartBlock > range.endBlock) {
        // keep walking backwards until within range
        log.debug(`Moloch proposal start block (${proposalStartBlock}) is after ${range.endBlock}, ending fetch.`);
      }
    }
    return results;
  }
}
