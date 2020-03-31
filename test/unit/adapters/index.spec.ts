/*
import { default as chai } from 'chai';
import { ApiRx } from '@polkadot/api';
import { ReferendumInfo, BlockNumber, BalanceOf } from '@polkadot/types/interfaces';
import { Vec, Tuple, bool, u64, Text, u32, createType, GenericCall, H256, u128 } from '@polkadot/types';

import app from 'state';
import { ProposalRecord } from 'edgeware-node-types/dist/signaling';
import {
  SubstrateDemocracyProposalAdapter,
  SubstrateDemocracyReferendumAdapter,
  SubstrateTreasuryProposalAdapter,
  SubstrateCollectiveAdapter,
  SubstrateElectionAdapter,
} from 'adapters/chain/substrate/subscriptions';
import {
  EdgewareSignalingProposalAdapter,
  EdgewareIdentityAdapter
} from 'adapters/chain/edgeware/subscriptions';
import {
  ISubstrateDemocracyReferendum, ISubstrateDemocracyProposal,
  ISubstrateTreasuryProposal, ISubstrateCollectiveProposal,
  ISubstrateElection, ISubstrateTreasuryProposalState,
  ISubstrateCollectiveProposalState,
  ISubstrateElectionState,
} from 'adapters/chain/substrate/types';
import { IEdgewareSignalingProposal, IEdgewareIdentity } from 'adapters/chain/edgeware/types';
import { MockApi, toOption } from '../../util/api.spec';
import { IdentityRecord, IdentityStage } from 'edgeware-node-types/dist/identity';
import {
  VoteRecord, Commitments, Reveals, VoteOutcome, VoteData, VoteStage, VoteType, TallyType
} from 'edgeware-node-types/dist/voting';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';
import moment = require('moment');
import { Codec } from '@polkadot/types/types';

const assert = chai.assert;
let api: MockApi = null;

// Codec types for coercing
type NextFinalize = [BlockNumber, u32, Vec<AccountId>] & Codec;
type DepositOf = [BalanceOf, Vec<AccountId>] & Codec;

class SignalingPropTuple extends Tuple.with([ H256, u32 ]) { }

beforeEach((done) => {
  api = new MockApi();
  done();
});

// Create a test suite (group) called Math
describe('subscriptions', () => {
  describe('democracy', () => {
    it('should immediately produce the on-chain ISubstrateDemocracyProposal', (done) => {
      api.addQuery('democracy', 'publicProps').next(
        new Vec(Tuple.with([u32, GenericCall, AccountId]), [['0', api.mockMethod, api.accounts[1]]]));
      api.addQuery('democracy', 'depositOf').next(toOption(
        [ createType('Balance', 1000),
          createType('Vec<AccountId>', [ api.accounts[1] ]) ] as DepositOf
      ));

      // wait for result
      const adapter = new SubstrateDemocracyProposalAdapter();
      const resultP = new Promise((resolve) => {
        adapter.subscribeNew(api as unknown as ApiRx).subscribe((proposal: ISubstrateDemocracyProposal) => {
          assert.deepEqual(proposal, {
            identifier: '0',
            index: 0,
            deposit: new u128(1000),
            method: api.mockIMethod,
            author: api.accounts[1].toString(),
          });
          resolve(proposal);
        });
      }).then((proposal: ISubstrateDemocracyProposal) => {
        adapter.subscribeState(api as unknown as ApiRx, proposal).subscribe((state) => {
          assert.deepEqual(state, {
            identifier: proposal.identifier,
            depositors: [api.accounts[1].toString()],
            completed: false,
          });
          done();
        });
      });
    });

    it('should immediately produce the on-chain ISubstrateDemocracyReferendum', (done) => {
      api.addQuery('democracy', 'nextTally').next(createType('ReferendumIndex', 0));
      api.addQuery('democracy', 'referendumCount').next(createType('ReferendumIndex', 1));
      api.addQuery('democracy', 'referendumInfoOf').next(toOption({
          proposal: api.mockMethod,
          end: createType('BlockNumber', 10),
          delay: createType('BlockNumber', 0),
          threshold: createType('VoteThreshold', 0),
        } as ReferendumInfo )
      );
      api.addDerive('democracy', 'referendumVotesFor').next([{
        accountId: api.accounts[1],
        balance: createType('Balance', api.balances[api.accounts[1].toString()]),
        vote: createType('Vote', { aye: true, conviction: 'Locked3x' }),
      }]);
      // TODO: write test for referendumVotesFor and state events
      // wait for result
      const adapter = new SubstrateDemocracyReferendumAdapter();
      const resultP = new Promise((resolve) => {
        adapter.subscribeNew(api as unknown as ApiRx).subscribe((ref: ISubstrateDemocracyReferendum) => {
          assert.deepEqual(ref, {
            identifier: '0',
            index: 0,
            method: api.mockIMethod,
            endBlock: 10,
            executionDelay: 0,
            threshold: (createType('VoteThreshold', 0)).toString(),
          });
          resolve(ref);
        });
      }).then((ref: ISubstrateDemocracyReferendum) => {
        adapter.subscribeState(api as unknown as ApiRx, ref).subscribe((state) => {
          assert.deepEqual(state, {
            identifier: ref.identifier,
            votes: {
              [api.accounts[1].toString()]: [
                true,
                3,
                new u128(api.balances[api.accounts[1].toString()]),
              ]
            },
            passed: false,
            completed: false,
            cancelled: false,
            executed: false,
          });
        });
        done();
      });
    });
  });

  describe('signaling', () => {
    it('should immediately produce the on-chain IEdgewareSignalingProposal', (done) => {
      const hash = createType('Hash', [1]);
      api.addQuery('signaling', 'activeProposals').next(
        new Vec(SignalingPropTuple, [ [ hash, createType('BlockNumber', 0) ] ])
      );
      api.addQuery('signaling', 'proposalOf').next(toOption(
        new ProposalRecord({
          index: new u32(0),
          author: api.accounts[0],
          stage: new VoteStage('Completed'),
          transition_time: createType('BlockNumber', 10),
          title: new Text('hello'),
          contents: new Text('world'),
          vote_id: new u64(10),
        })
      ));
      const outcomes = [new VoteOutcome([0]), new VoteOutcome([1])];
      api.addQuery('voting', 'voteRecords').next(toOption(
        new VoteRecord({
          id: new u64(10),
          commitments: new Commitments(),
          reveals: new Reveals([
            [ api.accounts[2], [ new VoteOutcome([0]) ] ]
          ]),
          outcomes: new Vec(VoteOutcome, outcomes),
          data: new VoteData({
            initiator: api.accounts[0],
            stage: new VoteStage('Completed'),
            vote_type: new VoteType('Binary'),
            tally_type: new TallyType('OneCoin'),
            is_commit_reveal: new bool(false),
          })
        })
      ));

      // wait for result
      const adapter = new EdgewareSignalingProposalAdapter();
      const resultP = new Promise((resolve) => {
        adapter.subscribeNew(api as unknown as ApiRx).subscribe((proposal: IEdgewareSignalingProposal) => {
          assert.deepEqual(proposal, {
            identifier: hash.toString(),
            hash: hash.toString(),
            author: api.accounts[0].toString(),
            title: 'hello',
            description: 'world',
            voteIndex: 10,
            voteType: new VoteType('Binary'),
            tallyType: new TallyType('OneCoin'),
            choices: outcomes,
          });
          resolve(proposal);
        });
      })
      .then((proposal: IEdgewareSignalingProposal) => {
        adapter.subscribeState(api as unknown as ApiRx, proposal).subscribe((state) => {
          assert.deepEqual(state, {
            identifier: state.identifier,
            endBlock: 10,
            stage: 'completed',
            votes: { [api.accounts[2].toString()]: [new VoteOutcome([0])] },
            completed: true,
          });
          done();
        });
      });
    });
  });

  describe('treasury', () => {
    it('should immediately produce the on-chain ISubstrateTreasuryProposal', (done) => {
      api.addQuery('treasury', 'approvals').next(createType('Vec<ProposalIndex>', []));
      api.addQuery('treasury', 'proposalCount').next(createType('ProposalIndex', 3));
      api.addQuery('treasury', 'proposals', (idx) => {
        if (idx === 1) {
          return toOption(createType('TreasuryProposal', {
            beneficiary: createType('AccountId', [1]),
            bond: createType('Balance', 100),
            proposer: createType('AccountId', [2]),
            value: createType('Balance', 200),
          }));
        } else {
          return toOption();
        }
      }).next(null);

      // wait for result
      const adapter = new SubstrateTreasuryProposalAdapter();
      const resultP = new Promise((resolve) => {
        adapter.subscribeNew(api as unknown as ApiRx).subscribe((proposal: ISubstrateTreasuryProposal) => {
          assert.deepEqual(proposal, {
            identifier: '1',
            index: 1,
            beneficiary: (new AccountId([1])).toString(),
            bond: new u128(100),
            value: new u128(200),
          });
          resolve(proposal);
        });
      }).then((proposal: ISubstrateTreasuryProposal) => {
        adapter.subscribeState(
          api as unknown as ApiRx,
          proposal
        ).subscribe((state: ISubstrateTreasuryProposalState) => {
          assert.deepEqual(state, {
            identifier: proposal.identifier,
            approved: false,
            awarded: false,
            completed: false,
          });
          done();
        });
      });
    });
  });

  describe('collective', () => {
    it('should immediately produce the on-chain ISubstrateCollectiveProposal', (done) => {
      const hash = createType('Hash', [1]);
      api.addQuery('council', 'proposals').next(createType('Vec<H256>', [hash]));
      api.addQuery('council', 'voting').next(toOption(
        createType('Votes', {
          index: createType('ProposalIndex', 1),
          threshold: createType('MemberCount', 4),
          ayes: [api.accounts[1]],
          nays: [api.accounts[2]],
        })
      ));
      api.addQuery('council', 'proposalOf').next(toOption(api.mockMethod));

      // wait for result
      const adapter = new SubstrateCollectiveAdapter('council');

      const resultP = new Promise((resolve) => {
        adapter.subscribeNew(api as unknown as ApiRx).subscribe((proposal: ISubstrateCollectiveProposal) => {
          assert.deepEqual(proposal, {
            identifier: hash.toString(),
            hash: hash.toString(),
            index: 1,
            method: api.mockIMethod,
            threshold: 4,
          });
          resolve(proposal);
        });
      }).then((proposal: ISubstrateCollectiveProposal) => {
        adapter.subscribeState(
          api as unknown as ApiRx,
          proposal
        ).subscribe((state: ISubstrateCollectiveProposalState) => {
          assert.deepEqual(state, {
            identifier: proposal.identifier,
            votes: { [api.accounts[1].toString()]: true, [api.accounts[2].toString()]: false },
            approved: false,
            completed: false,
          });
          // TODO: fire event and test Voted/Approved/Executed section
          done();
        });
      });
    });
  });

  describe('elections', () => {
    it('should immediately produce the on-chain IEdgewareCandidacy', (done) => {
      api.addQuery('elections', 'candidates').next(
        createType('Vec<AccountId>', [api.accounts[1], api.accounts[3]])
      );
      api.addDerive('elections', 'voters').next(createType('Vec<AccountId>', [api.accounts[2]]));
      api.addQuery('elections', 'nextFinalize').next(toOption([
        createType('BlockNumber', 10),
        createType('u32', 2),
        createType('Vec<AccountId>', [api.accounts[4]]),
      ] as NextFinalize));
      api.addQuery('elections', 'leaderboard').next(toOption());
      api.addQuery('elections', 'voterInfoOf').next(toOption(createType('VoterInfo', {
        lastActive: createType('VoteIndex', 1),
        lastWin: createType('VoteIndex', 0),
        pot: createType('Balance', 0),
        stake: createType('Balance', api.balances[api.accounts[2].toString()]),
      })));
      api.addDerive('elections', 'approvalsOf').next([[false, true]]);
      api.addQuery('elections', 'voteCount').next(createType('VoteIndex', 1));

      // wait for result
      const adapter = new SubstrateElectionAdapter();

      const resultP = new Promise((resolve) => {
        adapter.subscribeNew(api as unknown as ApiRx).subscribe((election: ISubstrateElection) => {
          assert.deepEqual(election, {
            identifier: '1',
            voteIndex: 1
          });
          resolve(election);
        });
      }).then((election: ISubstrateElection) => {
        adapter.subscribeState(
          api as unknown as ApiRx,
          election
        ).subscribe((state: ISubstrateElectionState) => {
          assert.deepEqual(state, {
            identifier: election.identifier,
            candidates: [ api.accounts[1].toString(), api.accounts[3].toString() ],
            votes: { [api.accounts[2].toString()]: {
              approvals: [false, true],
              stake: new u128(api.balances[api.accounts[2].toString()])
            } },
            presentationInfo: {
              endBlock: 10,
              expiringMembers: [api.accounts[4].toString()],
              leaderboard: [],
            },
            winners: [],
            completed: false,
          });
          done();
        });
      });
    });
  });

  describe('identities', () => {
    it('should immediately produce the on-chain IEdgewareIdentity', (done) => {
      const hash = createType('Hash', [1]);
      const identityRecord = new IdentityRecord({
        account: api.accounts[0],
        identity_type: 'github',
        identity: createType('Bytes', 'drewstone'),
        stage: new IdentityStage('Verified'),
        expiration_time: createType('Moment', 0),
        proof: 'abcdefg',
        metadata: toOption()
      });
      api.addQuery('identity', 'identities').next(createType('Vec<H256>', [hash]));
      api.addQuery('identity', 'identityOf').next(toOption(identityRecord));

      const adapter = new EdgewareIdentityAdapter();
      const resultP = new Promise((resolve) => {
        adapter.subscribeNew(api as unknown as ApiRx).subscribe((identity: IEdgewareIdentity) => {
          assert.deepEqual(identity, {
            identifier: hash.toString(),
            hash: hash.toString(),
            username: 'drewstone',
            account: api.accounts[0].toString(),
          });
          resolve(identity);
        });
      })
      .then((identity: IEdgewareIdentity) => {
        adapter.subscribeState(api as unknown as ApiRx, identity).subscribe((state) => {
          assert.deepEqual(state, {
            identifier: identity.identifier,
            stage: 'verified',
            proofLink: 'abcdefg',
            completed: true,
            expirationTime: moment(0),
          });
          done();
        });
      });
    });
  });
});
*/