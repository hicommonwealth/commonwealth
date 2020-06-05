import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import { IMolochEventData, MolochEventKind, MolochApi, Moloch1Proposal, Moloch2Proposal } from './types';
import { Moloch1 } from '../../../eth/types/Moloch1';
import { Moloch2 } from '../../../eth/types/Moloch2';

function isMoloch1Proposal(m: Moloch1Proposal | Moloch2Proposal): m is Moloch1Proposal {
  return 'sponsor' in m;
}

export default class extends IStorageFetcher<MolochApi> {
  private _currentPeriod: number;      // current contract period
  private _periodDuration: number;     // 1 period in blocks
  private _votingPeriodLength: number; // voting time in periods
  private _gracePeriodLength: number;  // grace time post-voting in periods
  private _summoningTime: number;      // starting block of contract

  private _eventsFromProposal(index: number, proposal: Moloch1Proposal | Moloch2Proposal): CWEvent<IMolochEventData>[] {
    const events: CWEvent<IMolochEventData>[] = [ ];
    if (isMoloch1Proposal(proposal)) {
      const startingBlock = (proposal.startingPeriod.toNumber() * this._periodDuration) + this._summoningTime;
      const proposedEvent: CWEvent<IMolochEventData> = {
        blockNumber: startingBlock,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: index,
          member: proposal.proposer,
          applicant: proposal.applicant,
          tokenTribute: proposal.tokenTribute.toHexString(),
          sharesRequested: proposal.sharesRequested.toHexString(),
        }
      };
      events.push(proposedEvent);
      if (proposal.aborted) {
        const abortedEvent: CWEvent<IMolochEventData> = {
          // we cannot know exactly when it was aborted, but we can invent a time
          blockNumber: startingBlock + 1,
          data: {
            kind: MolochEventKind.Abort,
            proposalIndex: index,
            applicant: proposal.applicant,
          }
        };
        events.push(abortedEvent);
      } else if (proposal.processed) {
        const processedBlock = startingBlock
          + ((this._votingPeriodLength + this._gracePeriodLength)
            * this._periodDuration);
        const processedEvent: CWEvent<IMolochEventData> = {
          blockNumber: processedBlock,
          data: {
            kind: MolochEventKind.ProcessProposal,
            proposalIndex: index,
            applicant: proposal.applicant,
            member: proposal.proposer,
            tokenTribute: proposal.tokenTribute.toHexString(),
            sharesRequested: proposal.sharesRequested.toHexString(),
            didPass: proposal.didPass,
          }
        };
        events.push(processedEvent);
      }
    } else {
      return [];
    }
    return events;
  }

  public async fetch(range?: IDisconnectedRange): Promise<CWEvent<IMolochEventData>[]> {
    // we need to fetch a few constants to convert voting periods into blocks
    this._currentPeriod = (await this._api.getCurrentPeriod()).toNumber();
    this._periodDuration = (await this._api.periodDuration()).toNumber();
    this._votingPeriodLength = (await this._api.votingPeriodLength()).toNumber();
    this._gracePeriodLength = (await this._api.gracePeriodLength()).toNumber();
    this._summoningTime = (await this._api.summoningTime()).toNumber();

    // we work backwards through the proposal queue ...
    const queueLength = (await this._api.getProposalQueueLength()).toNumber();
    const results: CWEvent<IMolochEventData>[] = [];
    /* eslint-disable no-await-in-loop, for-direction */
    for (let i = queueLength - 1; i >= 0; ++i) {
      const proposalIndex = this._api instanceof Moloch1
        ? i
        : (await this._api.proposalQueue(i)).toNumber();
      const proposal: Moloch1Proposal | Moloch2Proposal = this._api instanceof Moloch1
        ? await this._api.proposalQueue(proposalIndex)
        : await this._api.proposals(proposalIndex);
      const startingPeriod = proposal.startingPeriod.toNumber();
      const startingBlock = (startingPeriod * this._periodDuration) + this._summoningTime;
      if (startingBlock >= range.startBlock && startingBlock < range.endBlock) {
        results.push(...this._eventsFromProposal(proposalIndex, proposal));
      }
    }
    return results;
  }
}
