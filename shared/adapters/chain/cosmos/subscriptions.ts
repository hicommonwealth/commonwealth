import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { ProposalAdapter } from '../../shared';
import { ICosmosProposal, ICosmosProposalState, ICosmosProposalTally, CosmosProposalState, CosmosVoteChoice } from './types';
import { CosmosApi } from './api';
import { default as _ } from 'lodash';
import { takeWhile, filter } from 'rxjs/operators';

const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

const marshalTally = (tally): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: +tally.yes,
    abstain: +tally.abstain,
    no: +tally.no,
    noWithVeto: +tally.no_with_veto,
  };
};

export const voteToEnum = (voteOption: number | string): CosmosVoteChoice => {
  if (typeof voteOption === 'number') {
    switch (voteOption) {
      case 1: return CosmosVoteChoice.YES;
      case 2: return CosmosVoteChoice.ABSTAIN;
      case 3: return CosmosVoteChoice.NO;
      case 4: return CosmosVoteChoice.VETO;
      default: return null;
    }
  } else {
    return voteOption as CosmosVoteChoice;
  }
};

export class CosmosProposalAdapter
extends ProposalAdapter<CosmosApi, ICosmosProposal, ICosmosProposalState> {
  public subscribeNew(api: CosmosApi): Observable<ICosmosProposal[]> {
    // query all proposals
    const subject = new Subject<ICosmosProposal[]>();
    const msgToIProposal = (p): ICosmosProposal => {
      // handle older cosmoshub types
      const content = p.content || p.proposal_content;
      return {
        identifier: p.id || p.proposal_id,
        type: content.type,
        title: content.value.title,
        description: content.value.description,
        submitTime: p.submit_time,
        depositEndTime: p.deposit_end_time,
        votingEndTime: p.voting_end_time,
        votingStartTime: p.voting_start_time,
        proposer: p.proposer || null,
        state: {
          identifier: p.id || p.proposal_id,
          completed: isCompleted(p.proposal_status),
          status: p.proposal_status,
          totalDeposit: p.total_deposit ? +p.total_deposit.amount : 0,
          depositors: [],
          voters: [],
          tally: marshalTally(p.final_tally_result),
        }
      };
    };
    Promise.all([
      api.queryUrl(`/gov/proposals?status=deposit_period`, null, null, false),
      api.queryUrl(`/gov/proposals?status=voting_period`, null, null, false),
      api.queryUrl(`/gov/proposals?status=passed`, null, null, false),
      // limit the number of rejected proposals we fetch
      api.queryUrl(`/gov/proposals?status=rejected`, 1, 10, false),
    ]).then((proposalResps) => {
      const proposals = _.flatten(proposalResps.map((ps) => ps || [])).sort((p1, p2) => +p2.id - +p1.id);
      if (proposals) {
        const proposalPromises = proposals.map(async (p): Promise<ICosmosProposal> => {
          return msgToIProposal(p);
        });
        // emit all proposals
        Promise.all(proposalPromises).then((proposals) => subject.next(proposals));

        // init stream listener for new proposals
        api.observeEvent('MsgSubmitProposal').subscribe(async ({ msg, events }) => {
          let id;
          for (const { attributes } of events) {
            for (const { key, value } of attributes) {
              if (key === 'proposal_id') {
                id = value;
              }
            }
          }
          if (id === undefined) {
            console.log('could not find proposal id in events: ', events);
            return;
          }
          const p = await api.queryUrl(`/gov/proposals/${id}`);
          subject.next([ msgToIProposal(p) ]);
        });
      }
    }, (err) => console.error(err));
    return subject.asObservable();
  }

  public subscribeState(api: CosmosApi, proposal: ICosmosProposal): Observable<ICosmosProposalState> {
    if (proposal.state.completed) {
      throw new Error('should not subscribe cosmos proposal state if completed');
    }
    const subject = new BehaviorSubject<ICosmosProposalState>(null);
    // TODO: observe real-time events here re: proposal
    Promise.all([
      api.query.proposalDeposits(proposal.identifier),
      proposal.state.status === CosmosProposalState.DEPOSIT_PERIOD ?
        Promise.resolve(null) : api.query.proposalVotes(proposal.identifier),
      proposal.state.status === CosmosProposalState.DEPOSIT_PERIOD ?
        Promise.resolve(null) : api.query.proposalTally(proposal.identifier),
    ]).then(([depositResp, voteResp, tallyResp]) => {
      const state = proposal.state;
      if (depositResp) {
        for (const deposit of depositResp) {
          state.depositors.push([ deposit.depositor, deposit.amount.amount ]);
        }
      }
      if (voteResp) {
        for (const voter of voteResp) {
          const vote = voteToEnum(voter.option);
          if (vote) {
            state.voters.push([ voter.voter, vote ]);
          } else {
            console.error('voter: ' + voter.voter + ' has invalid vote option: ' + voter.option);
          }
        }
      }
      if (tallyResp) {
        state.tally = marshalTally(tallyResp);
      }
      subject.next(state);

      // init stream listeners for updates
      if (state.status === CosmosProposalState.DEPOSIT_PERIOD) {
        api.observeEvent('MsgDeposit').pipe(
          filter(({ msg }) => msg.value.proposal_id.toString() === proposal.identifier),
          takeWhile(() => !state.completed),
        ).subscribe(async ({ msg: deposit }) => {
          state.depositors.push([ deposit.value.sender, deposit.value.amount.amount ]);
          state.totalDeposit += +deposit.value.amount.amount;
          subject.next(state);
        });
      }

      // keep vote subscription open even during deposit period in case
      // the proposal goes into voting stage -- we can identify this and
      // shift the type
      api.observeEvent('MsgVote').pipe(
        filter(({ msg }) => msg.value.proposal_id.toString() === proposal.identifier),
        takeWhile(() => !state.completed),
      ).subscribe(async ({ msg: voter }) => {
        const vote = voteToEnum(voter.value.option);
        const voterAddress = voter.value.voter || voter.value.sender;
        if (!vote) {
          console.error('voter: ' + voterAddress + ' has invalid vote option: ' + voter.value.option);
        }
        const voterIdx = state.voters.findIndex(([v]) => v === voterAddress);
        if (voterIdx === -1) {
          // new voter
          state.voters.push([ voterAddress, vote ]);
        } else {
          state.voters[voterIdx][1] = vote;
        }
        const tallyResp = await api.query.proposalTally(proposal.identifier);
        if (tallyResp) state.tally = marshalTally(tallyResp);
        subject.next(state);
      });
    })
    .catch((err) => {
      console.log('error fetching state for proposal ' + proposal.identifier + ', err: ' + err);
    });
    return subject.asObservable();
  }
}
