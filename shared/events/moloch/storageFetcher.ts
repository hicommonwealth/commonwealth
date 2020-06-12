import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import { IMolochEventData, MolochEventKind, MolochApi, Moloch1Proposal, Moloch2Proposal } from './types';
import { Moloch1 } from '../../../eth/types/Moloch1';
import { Moloch2 } from '../../../eth/types/Moloch2';

export default class extends IStorageFetcher<MolochApi> {
  constructor(protected _api: MolochApi, private _version: 1 | 2) {
    super(_api);
  }

  private _periodDuration: number;     // 1 period in seconds
  private _summoningTime: number;      // starting time of contract
  private _startBlock: number;

  private _isMoloch1Proposal(m: Moloch1Proposal | Moloch2Proposal): m is Moloch1Proposal {
    return this._version === 1;
  }

  private _eventsFromProposal(
    index: number,
    proposal: Moloch1Proposal | Moloch2Proposal,
    startTime: number
  ): CWEvent<IMolochEventData>[] {
    const events: CWEvent<IMolochEventData>[] = [ ];
    if (this._isMoloch1Proposal(proposal)) {
      const proposedEvent: CWEvent<IMolochEventData> = {
        // fake it
        blockNumber: this._startBlock,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: index,
          member: proposal.proposer,
          applicant: proposal.applicant,
          tokenTribute: proposal.tokenTribute.toString(),
          sharesRequested: proposal.sharesRequested.toString(),
          startTime,
        }
      };
      events.push(proposedEvent);
      if (proposal.aborted) {
        const abortedEvent: CWEvent<IMolochEventData> = {
          // fake it
          blockNumber: this._startBlock + 1,
          data: {
            kind: MolochEventKind.Abort,
            proposalIndex: index,
            applicant: proposal.applicant,
          }
        };
        events.push(abortedEvent);
      } else if (proposal.processed) {
        const processedEvent: CWEvent<IMolochEventData> = {
          // fake it
          blockNumber: this._startBlock + 1,
          data: {
            kind: MolochEventKind.ProcessProposal,
            proposalIndex: index,
            applicant: proposal.applicant,
            member: proposal.proposer,
            tokenTribute: proposal.tokenTribute.toString(),
            sharesRequested: proposal.sharesRequested.toString(),
            didPass: proposal.didPass,
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

  public async fetch(range?: IDisconnectedRange): Promise<CWEvent<IMolochEventData>[]> {
    // we need to fetch a few constants to convert voting periods into blocks
    this._periodDuration = (await this._api.periodDuration()).toNumber();
    this._summoningTime = (await this._api.summoningTime()).toNumber();

    this._startBlock = range.startBlock || 0;
    let rangeStartTime = 0;
    let rangeEndTime = 0;
    if (range) {
      rangeStartTime = (await this._api.provider.getBlock(range.startBlock)).timestamp;
      if (!range.endBlock) {
        range.endBlock = await this._api.provider.getBlockNumber();
      }
      rangeEndTime = (await this._api.provider.getBlock(range.endBlock)).timestamp;
    } else {
      const currentBlock = await this._api.provider.getBlockNumber();
      rangeEndTime = (await this._api.provider.getBlock(currentBlock)).timestamp;
    }

    // we work backwards through the proposal queue ...
    // TODO: how do we handle votes?
    const queueLength = (await this._api.getProposalQueueLength()).toNumber();
    const results: CWEvent<IMolochEventData>[] = [];
    /* eslint-disable no-await-in-loop, for-direction */
    for (let i = queueLength - 1; i >= 0; --i) {
      const proposalIndex = this._version === 1
        ? i
        : (await (this._api as Moloch2).proposalQueue(i)).toNumber();
      const proposal: Moloch1Proposal | Moloch2Proposal = this._version === 1
        ? await this._api.proposalQueue(proposalIndex)
        : await this._api.proposals(proposalIndex);
      const startingPeriod = proposal.startingPeriod.toNumber();
      const proposalStartingTime = (startingPeriod * this._periodDuration) + this._summoningTime;
      if (proposalStartingTime >= rangeStartTime && proposalStartingTime <= rangeEndTime) {
        results.push(...this._eventsFromProposal(proposalIndex, proposal, proposalStartingTime));
      }
    }
    return results;
  }
}
