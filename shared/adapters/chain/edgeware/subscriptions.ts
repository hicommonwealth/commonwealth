/* eslint-disable no-restricted-syntax */
/* eslint-disable import/prefer-default-export */
import { VoteRecord, VoteOutcome, ProposalRecord } from 'edgeware-node-types/dist';
import { ApiRx } from '@polkadot/api';
import { flatMap, first, map, takeWhile } from 'rxjs/operators';
import { from, combineLatest, of, never } from 'rxjs';
import { Vec, Option } from '@polkadot/types';
import { BlockNumber, H256 } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import _ from 'underscore';
import { IEdgewareSignalingProposal, IEdgewareSignalingProposalState } from './types';
import { ProposalAdapter } from '../../shared';

type SignalingProposal = [ H256, BlockNumber ] & Codec;

export class EdgewareSignalingProposalAdapter
  extends ProposalAdapter<ApiRx, IEdgewareSignalingProposal, IEdgewareSignalingProposalState> {
  private _seenProposals = {};

  public subscribeNew(api: ApiRx) {
    return api.queryMulti([
      api.query.signaling.inactiveProposals,
      api.query.signaling.activeProposals,
      api.query.signaling.completedProposals,
    ]).pipe(
      // fetch new proposals
      map(([ inactiveProposals, activeProposals, completedProposals ]:
          [ Vec<SignalingProposal>, Vec<SignalingProposal>, Vec<SignalingProposal> ]) => {
        const toEmit: H256[] = [];
        for (const prop of [...inactiveProposals, ...activeProposals, ...completedProposals]) {
          if (!this._seenProposals[prop[0].toString()]) {
            this._seenProposals[prop[0].toString()] = true;
            toEmit.push(prop[0]);
          }
        }
        return toEmit;
      }),
      // fetch data about each proposal
      flatMap((props: H256[]) => {
        return combineLatest(
          of(props.map((p) => p.toString())),
          api.queryMulti(
            props.map((p) => [ api.query.signaling.proposalOf, p ])
          ).pipe(first())
        );
      }),
      // fetch vote information
      flatMap(([hashes, recordOpts]: [ string[], Array<Option<ProposalRecord>> ]) => {
        const props = _.zip(hashes, recordOpts)
          .filter(([h, opt]) => opt.isSome)
          .map(([h, opt]) => [ h, opt.unwrap() ]);
        return combineLatest(
          of(props),
          api.queryMulti(
            props.map(([h, rec]) => [ api.query.voting.voteRecords, rec.vote_id ])
          ).pipe(first())
        );
      }),
      // emit adapted proposals
      map(([props, voteRecordOpts]: [ Array<[string, ProposalRecord]>, Array<Option<VoteRecord>> ]) => {
        const zippedProps = _.zip(props, voteRecordOpts);
        const results: IEdgewareSignalingProposal[] = [];
        for (const [ [ hash, record ], voteRecordOpt ] of zippedProps) {
          if (voteRecordOpt.isSome) {
            const voteRecord = voteRecordOpt.unwrap();
            results.push({
              identifier: hash,
              hash,
              voteIndex: +record.vote_id,
              author: record.author.toString(),
              title: record.title.toString(),
              description: record.contents.toString(),
              tallyType: voteRecord.data.tally_type,
              voteType: voteRecord.data.vote_type,
              choices: voteRecord.outcomes.toArray(),
            });
          }
        }
        return results;
      })
    );
  }

  public subscribeState(api: ApiRx, proposal: IEdgewareSignalingProposal) {
    const state: IEdgewareSignalingProposalState = {
      identifier: proposal.identifier,
      completed: false,
      votes: {},
      stage: 'prevoting',
      endBlock: 0,
    };
    return api.queryMulti([
      [ api.query.voting.voteRecords, proposal.voteIndex ],
      [ api.query.signaling.proposalOf, proposal.hash ],
    ]).pipe(
      map(([voteRecordOpt, proposalRecordOpt]: [Option<VoteRecord>, Option<ProposalRecord>]) => {
        if (proposalRecordOpt && proposalRecordOpt.isSome) {
          const proposalRecord = proposalRecordOpt.unwrap();
          state.endBlock = +proposalRecord.transition_time;
          state.stage = proposalRecord.stage.toString().toLowerCase();
          if (state.stage === 'completed') {
            state.completed = true;
            // This is where we would remove this proposal from the seen list,
            // but signaling proposals are never deleted from the chain.
          }
        }
        if (voteRecordOpt && voteRecordOpt.isSome) {
          const voteRecord = voteRecordOpt.unwrap();
          voteRecord.reveals.forEach((voteData) => {
            const acct = voteData[0].toString();
            const outcomes = voteData[1] as Vec<VoteOutcome>;
            state.votes[acct] = outcomes.toArray();
          });
        }
        return state;
      }),
      takeWhile((s: IEdgewareSignalingProposalState) => !s.completed, true)
    );
  }
}
