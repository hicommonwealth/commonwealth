import EthDater from 'ethereum-block-by-date';

import {
  CWEvent,
  IStorageFetcher,
  IDisconnectedRange,
  SupportedNetwork,
} from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import { Moloch1, Moloch2 } from '../../contractTypes';

import { IEventData, EventKind, Api, ProposalV1, ProposalV2 } from './types';

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(
    protected readonly _api: Api,
    private readonly _version: 1 | 2,
    private readonly _dater: EthDater,
    chain?: string
  ) {
    super(_api);

    this.log = factory.getLogger(
      addPrefix(__filename, [SupportedNetwork.Moloch, chain])
    );
  }

  private _periodDuration: number; // 1 period in seconds

  private _summoningTime: number; // starting time of contract

  private _abortPeriod: number;

  private _votingPeriod: number;

  private _gracePeriod: number;

  private _currentBlock: number;

  private _currentTimestamp: number;

  private readonly log;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _isProposalV1(m: ProposalV1 | ProposalV2): m is ProposalV1 {
    return this._version === 1;
  }

  private async _eventsFromProposal(
    index: number,
    proposal: ProposalV1 | ProposalV2,
    startTime: number,
    startBlock: number
  ): Promise<CWEvent<IEventData>[]> {
    const events: CWEvent<IEventData>[] = [];
    if (this._isProposalV1(proposal)) {
      const proposedEvent: CWEvent<IEventData> = {
        blockNumber: startBlock,
        network: SupportedNetwork.Moloch,
        data: {
          kind: EventKind.SubmitProposal,
          proposalIndex: index,
          member: proposal.proposer,
          applicant: proposal.applicant,
          tokenTribute: proposal.tokenTribute.toString(),
          sharesRequested: proposal.sharesRequested.toString(),
          details: proposal.details,
          startTime,
        },
      };
      events.push(proposedEvent);
      if (proposal.aborted) {
        // derive block # from abort time
        const maximalAbortTime = Math.min(
          this._currentTimestamp,
          (startTime + this._abortPeriod * this._periodDuration) * 1000
        );
        let blockNumber;
        if (maximalAbortTime === this._currentTimestamp) {
          this.log.info('Still in abort window, using current timestamp.');
          blockNumber = this._currentBlock;
        } else {
          this.log.info(
            `Passed abort window, fetching timestamp ${maximalAbortTime}`
          );
          try {
            const abortBlock = await this._dater.getDate(maximalAbortTime);
            blockNumber = abortBlock.block;
          } catch (e) {
            // fake it if we can't fetch it
            this.log.error(
              `Unable to fetch abort block from timestamp ${maximalAbortTime}: ${e.message}.`
            );
            blockNumber = startBlock + 1;
          }
        }

        const abortedEvent: CWEvent<IEventData> = {
          blockNumber,
          network: SupportedNetwork.Moloch,
          data: {
            kind: EventKind.Abort,
            proposalIndex: index,
            applicant: proposal.applicant,
          },
        };
        events.push(abortedEvent);
      } else if (proposal.processed) {
        // derive block # from process time
        const minimalProcessTime =
          startTime +
          (this._votingPeriod + this._gracePeriod) * this._periodDuration;
        this.log.info(
          `Fetching minimum processed block at time ${minimalProcessTime}.`
        );
        let blockNumber;
        try {
          const processedBlock = await this._dater.getDate(
            minimalProcessTime * 1000
          );
          blockNumber = processedBlock.block;
        } catch (e) {
          // fake it if we can't fetch it
          this.log.error(
            `Unable to fetch processed block from timestamp ${minimalProcessTime}: ${e.message}.`
          );
          blockNumber = startBlock + 2;
        }

        const processedEvent: CWEvent<IEventData> = {
          blockNumber,
          network: SupportedNetwork.Moloch,
          data: {
            kind: EventKind.ProcessProposal,
            proposalIndex: index,
            applicant: proposal.applicant,
            member: proposal.proposer,
            tokenTribute: proposal.tokenTribute.toString(),
            sharesRequested: proposal.sharesRequested.toString(),
            didPass: proposal.didPass,
            yesVotes: proposal.yesVotes.toString(),
            noVotes: proposal.noVotes.toString(),
          },
        };
        events.push(processedEvent);
      }
    } else {
      // TODO: Moloch2
      return [];
    }
    return events;
  }

  private async _initConstants() {
    // we need to fetch a few constants to convert voting periods into blocks
    this._periodDuration = +(await this._api.periodDuration());
    this._summoningTime = +(await this._api.summoningTime());
    this._votingPeriod = +(await this._api.votingPeriodLength());
    this._gracePeriod = +(await this._api.gracePeriodLength());
    if (this._version === 1) {
      this._abortPeriod = +(await (this._api as Moloch1).abortWindow());
    }
    this._currentBlock = +(await this._api.provider.getBlockNumber());
    this.log.info(`Current block: ${this._currentBlock}.`);
    this._currentTimestamp = (
      await this._api.provider.getBlock(this._currentBlock)
    ).timestamp;
    this.log.info(`Current timestamp: ${this._currentTimestamp}.`);
  }

  public async fetchOne(id: string): Promise<CWEvent<IEventData>[]> {
    await this._initConstants();
    if (!this._currentBlock) {
      this.log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // fetch actual proposal
    let proposal: ProposalV1 | ProposalV2;
    try {
      proposal =
        this._version === 1
          ? await (this._api as Moloch1).proposalQueue(id)
          : await (this._api as Moloch2).proposals(id);
    } catch (e) {
      this.log.error(`Moloch proposal ${id} not found.`);
      return [];
    }
    this.log.debug(`Fetched Moloch proposal ${id} from storage.`);

    // compute starting time and derive closest block number
    const startingPeriod = +proposal.startingPeriod;
    const proposalStartingTime =
      startingPeriod * this._periodDuration + this._summoningTime;
    this.log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
    let proposalStartBlock: number;
    try {
      const block = await this._dater.getDate(proposalStartingTime * 1000);
      proposalStartBlock = block.block;
      this.log.debug(
        `For timestamp ${block.date}, fetched ETH block #${block.block}.`
      );
    } catch (e) {
      this.log.error(
        `Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`
      );
      this.log.error('Skipping proposal event fetch.');
      // eslint-disable-next-line no-continue
      return [];
    }

    const events = await this._eventsFromProposal(
      +id,
      proposal,
      proposalStartingTime,
      proposalStartBlock
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
   * @param fetchAllCompleted
   */
  public async fetch(
    range?: IDisconnectedRange,
    fetchAllCompleted = false
  ): Promise<CWEvent<IEventData>[]> {
    await this._initConstants();
    if (!this._currentBlock) {
      this.log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // populate range fully if not given
    if (!range) {
      range = { startBlock: 0, endBlock: this._currentBlock };
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
    if (!range.endBlock) {
      range.endBlock = this._currentBlock;
    }
    this.log.info(
      `Fetching Moloch entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    const queueLength = +(await this._api.getProposalQueueLength());
    const results: CWEvent<IEventData>[] = [];

    let nFetched = 0;
    for (let i = 0; i < queueLength; i++) {
      // work backwards through the queue, starting with the most recent
      const queuePosition = queueLength - i - 1;
      const proposalIndex =
        this._version === 1
          ? queuePosition
          : +(await (this._api as Moloch2).proposalQueue(queuePosition));

      // fetch actual proposal
      const proposal: ProposalV1 | ProposalV2 =
        this._version === 1
          ? await (this._api as Moloch1).proposalQueue(proposalIndex)
          : await (this._api as Moloch2).proposals(proposalIndex);
      this.log.debug(`Fetched Moloch proposal ${proposalIndex} from storage.`);

      // compute starting time and derive closest block number
      const startingPeriod = +proposal.startingPeriod;
      const proposalStartingTime =
        startingPeriod * this._periodDuration + this._summoningTime;
      this.log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
      let proposalStartBlock: number;
      try {
        const block = await this._dater.getDate(proposalStartingTime * 1000);
        proposalStartBlock = block.block;
        this.log.debug(
          `For timestamp ${block.date}, fetched ETH block #${block.block}.`
        );
      } catch (e) {
        this.log.error(
          `Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`
        );
        this.log.error('Skipping proposal event fetch.');
        // eslint-disable-next-line no-continue
        continue;
      }

      if (
        proposalStartBlock >= range.startBlock &&
        proposalStartBlock <= range.endBlock
      ) {
        const events = await this._eventsFromProposal(
          proposalIndex,
          proposal,
          proposalStartingTime,
          proposalStartBlock
        );
        results.push(...events);
        nFetched += 1;

        // halt fetch once we find a completed proposal in order to save data
        // we may want to run once without this, in order to fetch backlog, or else develop a pagination
        // strategy, but for now our API usage is limited.
        if (
          !fetchAllCompleted &&
          events.find((p) => p.data.kind === EventKind.ProcessProposal)
        ) {
          this.log.debug(
            `Proposal ${proposalIndex} is marked processed, halting fetch.`
          );
          break;
        }
        if (range.maxResults && nFetched >= range.maxResults) {
          this.log.debug(`Fetched ${nFetched} proposals, halting fetch.`);
          break;
        }
      } else if (proposalStartBlock < range.startBlock) {
        this.log.debug(
          `Moloch proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`
        );
        break;
      } else if (proposalStartBlock > range.endBlock) {
        // keep walking backwards until within range
        this.log.debug(
          `Moloch proposal start block (${proposalStartBlock}) is after ${range.endBlock}, ending fetch.`
        );
      }
    }
    return results;
  }
}
