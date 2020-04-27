import { ApiRx } from '@polkadot/api';
import BN from 'bn.js';
import {
  ISubstrateDemocracyProposal, ISubstrateDemocracyReferendum,
  ISubstrateCollectiveProposal,
  ISubstrateTreasuryProposal,
  ISubstrateDemocracyProposalState, ISubstrateDemocracyReferendumState,
  ISubstrateTreasuryProposalState,
  ISubstrateCollectiveProposalState,
  ISubstratePhragmenElection, ISubstratePhragmenElectionState, DemocracyThreshold
} from './types';
import {
  Call, BalanceOf, ReferendumInfoTo239, Hash, ProposalIndex,
  TreasuryProposal, VoteIndex, AccountId, PropIndex, ReferendumIndex, Votes,
  VoterInfo, BlockNumber, ReferendumInfo, ReferendumStatus
} from '@polkadot/types/interfaces';
import { Vec, Option, bool, u32, Bytes } from '@polkadot/types';
import { createType } from '@polkadot/types/create';
import { Codec } from '@polkadot/types/types';
import { default as _ } from 'lodash';
import { of, combineLatest, never, merge, concat } from 'rxjs';
import { flatMap, first, map, takeWhile, startWith, auditTime, switchMap } from 'rxjs/operators';
import { DeriveReferendum, DeriveReferendumVotes } from '@polkadot/api-derive/types';
import { EventData } from '@polkadot/types/generic/Event';
import { ProposalAdapter } from '../../shared';
import { marshallMethod, waitEvent, IMethod } from './shared';

type PublicProp = [PropIndex, Hash, AccountId] & Codec;
type DepositOf = [BalanceOf, Vec<AccountId>] & Codec;
type PreImage = Option<[Bytes, AccountId, BalanceOf, BlockNumber] & Codec>;

export class SubstrateDemocracyProposalAdapter
extends ProposalAdapter<ApiRx, ISubstrateDemocracyProposal, ISubstrateDemocracyProposalState> {
  private _seenProposals = {};

  public subscribeNew(api: ApiRx) {
    return api.query.democracy.publicProps<Vec<PublicProp>>().pipe(
      // emit all new proposals as single observables
      map((proposals: Vec<PublicProp>) => {
        const toEmit = [];
        for (const prop of proposals) {
          const idx = +prop[0];
          if (!this._seenProposals[idx]) {
            toEmit.push(prop);
            this._seenProposals[idx] = prop;
          }
        }
        return toEmit;
      }),
      // get deposit for each proposal
      flatMap((props: PublicProp[]) => {
        const validProps = props.filter((p) => !!p);
        return combineLatest(
          of(validProps),
          api.queryMulti(
            validProps.map(([ idx ]) => [ api.query.democracy.depositOf, +idx ])
          ).pipe(first()),
        );
      }),
      // emit adapted proposals
      map(([props, depositOpts]: [PublicProp[], Array<Option<DepositOf>>]) => {
        const zippedProps = _.zip(props, depositOpts);
        const results: ISubstrateDemocracyProposal[] = [];
        for (const [ [ idx, hash, creator ], depositOpt ] of zippedProps) {
          if (depositOpt.isSome) {
            const [ deposit ] = depositOpt.unwrap();
            results.push({
              identifier: `${+idx}`,
              index: +idx,
              hash,
              deposit: deposit,
              author: `${creator}`,
            });
          }
        }
        return results;
      })
    );
  }

  public subscribeState(api: ApiRx, proposal: ISubstrateDemocracyProposal) {
    const state: ISubstrateDemocracyProposalState = {
      identifier: proposal.identifier,
      completed: false,
      depositors: [],
      method: null,
    };
    return merge(
      //api.query.democracy.preimages(proposal.hash).pipe(
      //  map((preimage: PreImage) => {
      //    // TODO: use this preimage in more detail once I understand it
      //    if (preimage.isSome) {
      //      const [ propVec, proposer, balance, at ] = preimage.unwrap();
      //      //const prop = createType(api.registry, 'Proposal', propVec);
      //      //state.method = marshallMethod(prop);
      //      return state;
      //    } else {
      //      return state;
      //    }
      //  })
      //),
      api.query.democracy.depositOf(proposal.index).pipe(
        map((depositOpt: Option<DepositOf>) => {
          if (!depositOpt || !depositOpt.isSome) {
            state.completed = true;
          } else {
            const deposit = depositOpt.unwrap();
            state.depositors = deposit[1].map((a) => a.toString());
          }

          // cleanup
          if (state.completed && this._seenProposals[proposal.index]) {
            delete this._seenProposals[proposal.index];
          }
          return state;
        }),
      ),
    ).pipe(
      takeWhile((s: ISubstrateDemocracyProposalState) => !s.completed, true)
    );
  }
}

export class SubstrateDemocracyReferendumAdapter
extends ProposalAdapter<ApiRx, ISubstrateDemocracyReferendum, ISubstrateDemocracyReferendumState> {
  private _lastIdEmitted = 0;

  constructor(
    private _useRedesignLogic: boolean = false,
  ) {
    super();
  }

  public subscribeNew(api: ApiRx) {
    // lowestUnbaked = next referendum to tally = oldest index
    // referendumCount = # of referendums created thus far = newest index
    // whenever lowestUnbaked changes, an old referendum has completed
    // whenveer referendumCount changes, a new referendum has been created
    return api.queryMulti([
      api.query.democracy.lowestUnbaked,
      api.query.democracy.referendumCount,
    ]).pipe(
      // fetch new referendums
      // the indexes are densely populated between nextTally and referendumCount
      map(([lowestUnbaked, referendumCount]: [ReferendumIndex, ReferendumIndex]) => {
        if (+referendumCount > this._lastIdEmitted) {
          const firstIndex = Math.max(+lowestUnbaked, this._lastIdEmitted);
          const toEmit = [...Array(+referendumCount - firstIndex)].map((_, i) => i + firstIndex);
          this._lastIdEmitted = +referendumCount;
          return toEmit;
        } else {
          return [];
        }
      }),
      // for each new referendum, fetch info
      flatMap((ids: number[]) => {
        return combineLatest(
          of(ids),
          api.queryMulti(
            ids.map((id) => [ api.query.democracy.referendumInfoOf, id ])
          ).pipe(first()),
        );
      }),
      // emit adapted referendums
      map(([ids, recordOpts]: [number[], Array<Option<ReferendumInfoTo239>> | Array<Option<ReferendumInfo>>]) => {
        const results: ISubstrateDemocracyReferendum[] = [];
        if (this._useRedesignLogic) {
          const referenda = _.zip(ids, recordOpts as Array<Option<ReferendumInfo>>);
          for (const [ id, recordOpt ] of referenda) {
            if (recordOpt.isSome) {
              const record = recordOpt.unwrap();
              if (record.isFinished) {
                const { end } = record.asFinished;
                results.push({
                  identifier: `${id}`,
                  index: id,
                  endBlock: +end,
                });
              } else {
                const { proposalHash, threshold, end, delay } = record.asOngoing;
                results.push({
                  identifier: `${id}`,
                  index: id,
                  hash: proposalHash.toU8a(),
                  threshold: threshold.toString() as DemocracyThreshold,
                  endBlock: +end,
                  executionDelay: +delay,
                });
              }
            }
          }
        } else {
          const referenda = _.zip(ids, recordOpts as Array<Option<ReferendumInfoTo239>>);
          for (const [ id, recordOpt ] of referenda) {
            if (recordOpt.isSome) {
              const record = recordOpt.unwrap();
              results.push({
                identifier: `${id}`,
                index: id,
                hash: record.proposalHash.toU8a(),
                threshold: record.threshold.toString() as DemocracyThreshold,
                endBlock: +record.end,
                executionDelay: +record.delay,
              })
            }
          }
        }
        return results;
      })
    );
  }

  public subscribeState(api: ApiRx, proposal: ISubstrateDemocracyReferendum) {
    const state: ISubstrateDemocracyReferendumState = {
      identifier: proposal.identifier,
      completed: false,
      method: null,
      votes: {},
      passed: false,
      executionBlock: null,
    };
    return combineLatest(
      // returns if the proposal is not yet passed/failed
      api.derive.democracy.referendumsInfo([ new BN(proposal.identifier) ]).pipe(
        switchMap((referenda: DeriveReferendum[]) => {
          if (referenda.length) {
            // we can fetch the data, so grab the votes too
            return api.derive.democracy._referendumVotes(referenda[0]);
          } else {
            return of(null);
          }
        })
      ),
      this._useRedesignLogic ? api.query.democracy.referendumInfoOf(new BN(proposal.identifier)) : of(null),
      // returns if proposal is passed and waiting
      api.query.democracy.dispatchQueue(),
    ).pipe(
      flatMap(([ votes, refInfo, dispatchQueue ]:
          [ DeriveReferendumVotes, Option<ReferendumInfo>, Array<[BlockNumber, Hash, ReferendumIndex] & Codec> ]) => {
        if (votes) {
          votes.votes.forEach((v) => {
            state.votes[v.accountId.toString()] = [v.vote.isAye, v.vote.conviction.index, v.balance];
          });
        }
        const dispatchData = dispatchQueue.find(([executionBlock, hash, idx]) => +idx === proposal.index);
        let hash = proposal.hash;
        if (dispatchData) {
          const [ executionBlock, proposalHash ] = dispatchData;
          state.passed = true;
          state.executionBlock = +executionBlock;

          // now we can fetch the preimage without knowing the hash in the beginning
          hash = hash || proposalHash;
        } else if (refInfo && refInfo.isSome) {
          // This only happens on kusama -- we use it to check whether a finished referendum passed
          //   on edgeware, the finished referendum will just disappear.
          // Note that in this case, the preimage will be deleted from the chain.
          const ref = refInfo.unwrap() as ReferendumInfo;
          if (ref.isFinished) {
            const { approved } = ref.asFinished;
            state.passed = approved.isTrue;
            state.completed = true;
          }
        } else if (!votes) {
          // on edgeware, once the votes and queue disapppear, we're done.
          state.completed = true;
        }
        return hash ? api.query.democracy.preimages(hash) : of(null);
      }),
      map((preimage: PreImage) => {
        if (preimage && preimage.isSome) {
          const [ propVec, proposer, balance, at ] = preimage.unwrap();
          const prop = createType(api.registry, 'Proposal', propVec.toU8a(true));
          state.method = marshallMethod(prop);
        }
        return state;
      }),
      takeWhile((s: ISubstrateDemocracyReferendumState) => !s.completed, true)
    );
  }
}

export class SubstrateTreasuryProposalAdapter
extends ProposalAdapter<ApiRx, ISubstrateTreasuryProposal, ISubstrateTreasuryProposalState> {
  private _lastIdEmitted = 0;

  public subscribeNew(api: ApiRx) {
    return api.query.treasury.proposalCount().pipe(
      // emit each new id as a proposal
      map((count: ProposalIndex) => {
        if (+count - this._lastIdEmitted > 0) {
          const proposals = [...Array(+count - this._lastIdEmitted).keys()].map((i) => i + this._lastIdEmitted);
          this._lastIdEmitted = +count;
          return proposals;
        } else {
          return [];
        }
      }),
      // fetch data about ids
      flatMap((ids: number[]) => {
        return combineLatest(
          of(ids),
          api.queryMulti(
            ids.map((id) => [ api.query.treasury.proposals, id ])
          ).pipe(first()),
        );
      }),
      // emit valid adapted proposals
      map(([ids, proposalOpts]: [number[], Array<Option<TreasuryProposal>>]) => {
        const props = _.zip(ids, proposalOpts);
        const results: ISubstrateTreasuryProposal[] = [];
        for (const [ id, proposalOpt ] of props) {
          if (proposalOpt.isSome) {
            const proposal = proposalOpt.unwrap();
            results.push({
              identifier: `${id}`,
              index: id,
              value: proposal.value,
              proposer: proposal.proposer.toString(),
              beneficiary: proposal.beneficiary ? proposal.beneficiary.toString() : null,
              bond: proposal.bond,
            })
          }
        }
        return results;
      })
    );
  }

  public subscribeState(api: ApiRx, proposal: ISubstrateTreasuryProposal) {
    const state: ISubstrateTreasuryProposalState = {
      identifier: proposal.identifier,
      completed: false,
      approved: false,
      awarded: false
    };
    return combineLatest(
      api.queryMulti([
        [ api.query.treasury.proposals, proposal.index ],
        api.query.treasury.approvals,
      ]),
      waitEvent(api, (e: EventData) => {
        return e.section === 'treasury' && e.method === 'Awarded' && +e[0] === proposal.index;
      }).pipe(
        startWith(null),
      ),
    ).pipe(
      auditTime(100), // debounce for approval/awarding event
      map(([ [ proposalOpt, approvals ], e]: [ [ Option<TreasuryProposal>, Vec<ProposalIndex> ], EventData]) => {
        // approvals always happen first, before spend
        if (approvals.find((v) => +v === proposal.index) !== undefined) {
          state.approved = true;
        }

        // we only have event data if it was awarded
        if (e) {
          state.awarded = true;
        }

        // proposal opt is removed when funds are awarded or when rejected
        if (!proposalOpt || !proposalOpt.isSome) {
          state.completed = true;
        }
        return state;
      }),
      takeWhile((s: ISubstrateTreasuryProposalState) => !s.completed, true)
    );
  }
}

export class SubstrateCollectiveAdapter
extends ProposalAdapter<ApiRx, ISubstrateCollectiveProposal, ISubstrateCollectiveProposalState> {
  private _seenProposals = {};
  private _moduleName: string;

  constructor(moduleName: string) {
    super();
    this._moduleName = moduleName;
  }

  public subscribeNew(api: ApiRx) {
    return api.query[this._moduleName].proposals().pipe(
      // flatten new proposals
      map((proposals: Vec<Hash>) => {
        const toEmit = [];
        for (const proposal of proposals) {
          if (!this._seenProposals[proposal.toString()]) {
            this._seenProposals[proposal.toString()] = true;
            toEmit.push(proposal);
          }
        }
        return toEmit;
      }),

      // fetch data
      flatMap((proposals: Hash[]) => {
        return combineLatest(
          of(proposals.map((p) => p.toString())),
          api.queryMulti(
            proposals.map((p) => [ api.query[this._moduleName].voting, p ])
          ).pipe(first()),
          api.queryMulti(
            proposals.map((p) => [ api.query[this._moduleName].proposalOf, p ])
          ).pipe(first()),
        );
      }),

      // emit
      map(([hashes, voteDataOpts, methodOpts]: [string[], Array<Option<Votes>>, Array<Option<Call>>]) => {
        const props = _.zip(hashes, voteDataOpts, methodOpts);
        const results: ISubstrateCollectiveProposal[] = [];
        for (const [ hash, voteDataOpt, methodOpt ] of props) {
          if (voteDataOpt.isSome && methodOpt.isSome) {
            const voteData = voteDataOpt.unwrap();
            const method = methodOpt.unwrap();
            results.push({
              identifier: hash,
              hash: hash,
              index: +voteData.index,
              method: marshallMethod(method),
              threshold: +voteData.threshold,
            })
          }
        }
        return results;
      })
    );
  }

  public subscribeState(api: ApiRx, motion: ISubstrateCollectiveProposal) {
    const state: ISubstrateCollectiveProposalState = {
      identifier: motion.identifier,
      completed: false,
      votes: { },
      approved: false,
    };

    return concat(
      // handle initial collection of votes -- all further will be handled by events
      api.query[this._moduleName].voting<Option<Votes>>(motion.hash).pipe(
        first(),
        flatMap((votesOpt) => {
          if (!votesOpt.isSome) {
            return never();
          }
          const votes = votesOpt.unwrap();
          for (const voter of votes.ayes) {
            state.votes[voter.toString()] = true;
          }
          for (const voter of votes.nays) {
            state.votes[voter.toString()] = false;
          }
          return of(state);
        })
      ),
      // handle events to determine completion, subscribed once votes completes
      waitEvent(api, (e: EventData) => {
        if (e.section !== this._moduleName) {
          return false;
        }
        if (e.method === 'Approved'
            || e.method === 'Disapproved'
            || e.method === 'Executed'
            || e.method === 'MemberExecuted') {
          return (e[0] as Hash).toString() === motion.hash;
        }
        if (e.method === 'Voted') {
          return (e[1] as Hash).toString() === motion.hash;
        }
        return false;
      }).pipe(
        map((e: EventData) => {
          if (e.method === 'Voted') {
            // some votes wont show up in the voting query, esp if it was the final approval vote, so add here
            state.votes[(e[0] as AccountId).toString()] = (e[2] as bool).valueOf();
          }
          if (e.method === 'Approved' || e.method === 'Executed' || e.method === 'MemberExecuted') {
            state.completed = true;
            // approval doesn't imply that the requested action was carried out, merely that an attempt
            // was made on chain -- it may still be rejected during origin-checking.
            state.approved = true;
          } else if (e.method === 'Disapproved') {
            state.completed = true;
          }

          // free up space
          if (state.completed && this._seenProposals[motion.hash]) {
            delete this._seenProposals[motion.hash];
          }
          return state;
        }),
      )
    ).pipe(
      takeWhile((s: ISubstrateCollectiveProposalState) => !s.completed, true)
    );
  }
}

export class SubstratePhragmenElectionAdapter
extends ProposalAdapter<ApiRx, ISubstratePhragmenElection, ISubstratePhragmenElectionState> {
  constructor(
    private _moduleName: string,
  ) {
    super();
  }

  private _currentIndex: number;
  public subscribeNew(api: ApiRx) {
    return api.query[this._moduleName].electionRounds().pipe(
      // take current block number to determine when round ends
      flatMap((voteIndex: u32) => {
        this._currentIndex = +voteIndex;
        return api.derive.chain.bestNumber();
      }),
      first(),
      map((blockNumber: BlockNumber) => {
        const termDuration = +api.consts[this._moduleName].termDuration;
        const roundStartBlock = Math.floor((+blockNumber) / termDuration) * termDuration;
        const endBlock = roundStartBlock + termDuration;
        return [{
          identifier: `${this._currentIndex}`,
          round: this._currentIndex,
          endBlock,
        }];
      }),
    );
  }

  public subscribeState(api: ApiRx, election: ISubstratePhragmenElection) {
    const state: ISubstratePhragmenElectionState = {
      identifier: election.identifier,
      completed: false,
      candidates: null,
    };
    return api.query[this._moduleName].candidates().pipe(
      map((candidates: Vec<AccountId>) => {
        // fetch final values on completion
        if (election.round !== this._currentIndex) {
          state.completed = true;
          return state;
        }

        // if not completed, fetch all candidates and voters
        state.candidates = candidates.map((c) => c.toString());
        return state;
      }),
      takeWhile((s) => !s.completed, true),
    );
  }
}
