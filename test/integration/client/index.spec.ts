/*
import { default as chai } from 'chai';
import { ApiRx } from '@polkadot/api';
import { DerivedReferendumVote } from '@polkadot/api-derive/types';

import app from 'state';
import { ProposalRecord } from 'edgeware-node-types/dist/signaling';
import {
  VoteRecord, VoteOutcome, VoteData, VoteStage, VoteType, TallyType, Commitments, Reveals
} from 'edgeware-node-types/dist/voting';
import { MockApi, toOption } from '../../util/api.spec';
import { UpdateType } from 'models/stores';
import { IdentityStage } from 'controllers/chain/edgeware/identity';
import {
  IdentityRecord, IdentityStage as EdgeIdentityStage
} from 'edgeware-node-types/dist/identity';
import moment = require('moment-twitter');
import { ProposalStatus, NodeInfo, ChainInfo } from 'models/models';
import { createType, Vec, Tuple, u32, GenericCall, H256, u128 } from '@polkadot/types';
import AccountId from '@polkadot/types/primitive/Generic/AccountId';
import { ReferendumInfo } from '@polkadot/types/interfaces/democracy';
import { BlockNumber, BalanceOf } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import Edgeware from 'controllers/chain/edgeware/main';

app.config.chains.add(new ChainInfo('testchain', 'testchain', 'TEST', 'Test Chain', null, 'This is a chain for testing'));

let api: MockApi = null;
const assert = chai.assert;

// Codec types for coercing
type NextFinalize = [BlockNumber, u32, Vec<AccountId>] & Codec;
type DepositOf = [BalanceOf, Vec<AccountId>] & Codec;

const loadChain = (mod, cb) => {
  if (app.chain) {
    assertDeinit();
  }
  const edgeware = new Edgeware(new NodeInfo(null, 'testchain', 'test.test'));
  app.chain = edgeware;
  edgeware.chain.initApi(api as unknown as ApiRx)
  .then(() => edgeware.chain.initMetadata())
  .then(() => edgeware.accounts.init(edgeware.chain))
  .then(() => edgeware[mod].init(edgeware.chain, edgeware.accounts))
  .then(() => edgeware.chain.initEventLoop())
  .then(() => {
    cb();
  });
};

const deloadChain = (...mods) => {
  const edgeware = app.chain as Edgeware;
  for (const mod of mods) {
    console.log(mod);
    edgeware[mod].deinit();
  }
  edgeware.chain.deinitEventLoop();
  edgeware.chain.deinitMetadata();
};

const assertDeinit = () => {
  const edgeware = app.chain as Edgeware;
  assert.isFalse(edgeware.chain.metadataInitialized);
  assert.isFalse(edgeware.chain.eventsInitialized);
  assert.isFalse(edgeware.accounts.initialized);
  assert.isFalse(edgeware.identities.initialized);
  assert.isFalse(edgeware.democracy.initialized);
  assert.isFalse(edgeware.democracyProposals.initialized);
  assert.isFalse(edgeware.signaling.initialized);
  assert.isFalse(edgeware.treasury.initialized);
  assert.isFalse(edgeware.council.initialized);
  assert.isFalse(edgeware.elections.initialized);
};

enum TXState {
  Waiting,
  Ready,
  Success,
  Failure,
  Error
}

class PublicPropTuple extends Tuple.with([ u32, GenericCall, AccountId ]) { }
class SignalingPropTuple extends Tuple.with([ H256, u32 ]) { }

// Create a test suite (group) called Math
describe('subscriptions', () => {
  describe('democracyproposals', () => {
    let subscription = null;
    // Mock democracy calls
    beforeEach((done) => {
      api = new MockApi();
      api.addConst('democracy', 'minimumDeposit', createType('BalanceOf', 0));
      api.addConst('democracy', 'launchPeriod', createType('BlockNumber', 1));
      api.addQuery('democracy', 'nextTally').next(createType('ReferendumIndex', 0));
      api.addQuery('democracy', 'referendumCount').next(createType('ReferendumIndex', 0));
      api.addQuery('democracy', 'publicProps').next(new Vec(PublicPropTuple));
      api.addQuery('democracy', 'depositOf').next(toOption());
      done();
    });

    afterEach((done) => {
      subscription.unsubscribe();
      deloadChain('democracyProposals', 'accounts');
      done();
    });

    it('should convert democracy data to SubstrateDemocracyProposal', (done) => {
      // set up chain state
      const author = createType('AccountId', [1]);
      api.addQuery('democracy', 'publicProps').next(
        new Vec(PublicPropTuple, [['0', api.mockMethod, author]]));
      api.addQuery('democracy', 'depositOf').next(
        toOption([createType('BalanceOf', 1000), createType('Vec<AccountId>', [])] as DepositOf));

      loadChain('democracyProposals', () => {
        subscription = (app.chain as Edgeware).democracyProposals.store.getObservable().subscribe((storeUpdate) => {
          const proposal = storeUpdate.item;
          assert.deepEqual(proposal.data, {
            identifier: '0',
            index: 0,
            method: api.mockIMethod,
            deposit: new u128(1000),
            author: author.toString(),
          });
          assert.deepEqual(proposal.method.meta, api.mockMethod.meta);
          done();
        });
      });
    });
  });

  describe('democracy', () => {
    let subscription = null;
    // Mock democracy calls
    beforeEach((done) => {
      api = new MockApi();
      api.addConst('democracy', 'minimumDeposit', createType('BalanceOf', 0));
      api.addConst('democracy', 'launchPeriod', createType('BlockNumber', 1));
      api.addQuery('democracy', 'nextTally').next(createType('ReferendumIndex', 0));
      api.addQuery('democracy', 'referendumCount').next(createType('ReferendumIndex', 0));
      api.addQuery('democracy', 'publicProps').next(new Vec(PublicPropTuple));
      api.addQuery('democracy', 'depositOf').next(toOption());
      done();
    });

    afterEach((done) => {
      subscription.unsubscribe();
      deloadChain('democracy', 'accounts');
      done();
    });

    it('should convert democracy data to SubstrateDemocracyReferendum', (done) => {
      // set up chain state
      api.addQuery('democracy', 'nextTally').next(createType('ReferendumIndex', 0));
      api.addQuery('democracy', 'referendumCount').next(createType('ReferendumIndex', 1));
      api.addQuery('democracy', 'referendumInfoOf', (idx) => toOption({
        end: createType('BlockNumber', idx),
        proposal: api.mockMethod,
        delay: createType('BlockNumber', 0),
        threshold: createType('VoteThreshold', 'Super majority rejection')
      } as ReferendumInfo)).next(null);

      api.addDerive('democracy', 'referendumVotesFor').next(
        [{
          accountId: api.accounts[0],
          balance: createType('Balance', api.balances[api.accounts[0].toString()]),
          vote: createType('Vote', { aye: true, conviction: 'Locked1x' }),
        } as DerivedReferendumVote]
      );
      loadChain('democracy', () => {
        subscription = (app.chain as Edgeware).democracy.store.getObservable().subscribe((storeUpdate) => {
          const ref = storeUpdate.item;
          assert.deepEqual(ref.data, {
            identifier: '0',
            index: 0,
            method: api.mockIMethod,
            endBlock: 0,
            executionDelay: 0,
            threshold: 'Super majority rejection',
          });
          // TODO: fix tests
          //assert.deepEqual(ref.accountsVotedYes, [SubstrateAccount.fromAddress(api.accounts[0].toString())]);
          //assert.deepEqual(ref.edgVotedYes, new u128(api.balances[api.accounts[0].toString()]));
          //assert.deepEqual(ref.edgVotedNo, new u128(0));
          assert.deepEqual(ref.isPassing, ProposalStatus.Passing);
          assert.deepEqual(ref.method.meta, api.mockMethod.meta);
          done();
        });
      });
    });
  });

  describe('signaling', () => {
    let subscription = null;
    beforeEach((done) => {
      api = new MockApi();
      done();
    });

    afterEach((done) => {
      subscription.unsubscribe();
      deloadChain('signaling', 'accounts');
      done();
    });

    it('should convert signaling data to EdgewareSignalingProposal', (done) => {
      // set up chain state
      const hash = createType('Hash', [1]);
      api.addQuery('signaling', 'activeProposals').next(
        new Vec(SignalingPropTuple, [ [ hash, createType('BlockNumber', 0) ] ])
      );
      api.addQuery('signaling', 'proposalOf').next(toOption(
        new ProposalRecord({
          index: createType('u32', 0),
          author: api.accounts[0],
          stage: new VoteStage('Voting'),
          transition_time: createType('BlockNumber', 0),
          title: createType('Text', 'hello'),
          contents: createType('Text', 'world'),
          vote_id: createType('u64', 10),
        })
      ));
      const outcomes = [new VoteOutcome([0]), new VoteOutcome([1])];
      const outcomeVec = new Vec(VoteOutcome, outcomes);
      const reveals = new Reveals([[api.accounts[1], new Vec(VoteOutcome, [new VoteOutcome([1])])]]);
      // TODO: add case for testing actual votes
      api.addQuery('voting', 'voteRecords').next(toOption(
        new VoteRecord({
          id: createType('u64', 10),
          commitments: new Commitments(),
          reveals: reveals,
          outcomes: outcomeVec,
          data: new VoteData({
            initiator: api.accounts[0],
            stage: new VoteStage('Voting'),
            vote_type: new VoteType('RankedChoice'),
            tally_type: new TallyType('OneCoin'),
            is_commit_reveal: createType('bool', false),
          })
        })
      ));

      loadChain('signaling', () => {
        subscription = (app.chain as Edgeware).signaling.store.getObservable().subscribe((storeUpdate) => {
          const proposal = storeUpdate.item;
          assert.deepEqual(proposal.data, {
            identifier: hash.toString(),
            hash: hash.toString(),
            author: api.accounts[0].toString(),
            title: 'hello',
            description: 'world',
            voteIndex: 10,
            voteType: new VoteType('RankedChoice'),
            tallyType: new TallyType('OneCoin'),
            choices: outcomes,
          });
          done();
        });
      });
    });
  });

  describe('treasury', () => {
    let subscription = null;
    beforeEach((done) => {
      api = new MockApi();
      done();
    });

    afterEach((done) => {
      subscription.unsubscribe();
      deloadChain('treasury', 'accounts');
      done();
    });

    it('should convert treasury data to SubstrateTreasuryProposal', (done) => {
      // set up chain state
      api.addQuery('treasury', 'proposalCount').next(createType('ProposalIndex', 3));
      api.addQuery('treasury', 'approvals').next(createType('Vec<ProposalIndex>', []));
      api.addQuery('treasury', 'proposals', (idx) => {
        if (idx === 1) {
          return toOption(createType('TreasuryProposal', {
            beneficiary: api.accounts[0],
            bond: createType('BalanceOf', 100),
            proposer: api.accounts[1],
            value: createType('BalanceOf', 200),
          }));
        } else {
          return toOption();
        }
      }).next(null);

      loadChain('treasury', () => {
        assert.deepEqual((app.chain as Edgeware).treasury.computeBond(app.chain.chain.coins(200)),
          app.chain.chain.coins(100));
        subscription = (app.chain as Edgeware).treasury.store.getObservable().subscribe((storeUpdate) => {
          const proposal = storeUpdate.item;
          assert.deepEqual(proposal.data, {
            identifier: '1',
            index: 1,
            beneficiary: api.accounts[0].toString(),
            bond: new u128(100),
            value: new u128(200),
          });
          // nonvoting proposal
          done();
        });
      });
    });
  });

  describe('collective', () => {
    let subscription = null;
    beforeEach((done) => {
      api = new MockApi();
      done();
    });

    afterEach((done) => {
      subscription.unsubscribe();
      deloadChain('council', 'accounts');
      done();
    });

    it('should convert council_motions data to SubstrateCollectiveProposal', (done) => {
      // set up chain state
      const hash = createType('Hash', [1]);
      api.addQuery('council', 'proposals').next(createType('Vec<H256>', [hash]));
      api.addQuery('council', 'proposalOf').next(toOption(api.mockMethod));
      api.addQuery('council', 'voting').next(toOption(
        createType('Votes', {
          index: createType('ProposalIndex', 1),
          threshold: createType('MemberCount', 4),
          ayes: new Vec(AccountId, [api.accounts[0]]),
          nays: new Vec(AccountId),
        })
      ));
      api.addEvent('council', 'Voted', [api.accounts[0], hash, createType('bool', true), 1, 0], 0);

      loadChain('council', () => {
        subscription = (app.chain as Edgeware).council.store.getObservable().subscribe((storeUpdate) => {
          const motion = storeUpdate.item;
          assert.deepEqual(motion.data, {
            identifier: hash.toString(),
            hash: hash.toString(),
            index: 1,
            method: api.mockIMethod,
            threshold: 4,
          });
          assert.deepEqual(motion.method.meta, api.mockMethod.meta);
          assert.deepEqual(
            motion.accountsVotedYes,
            [app.chain.accounts.get(api.accounts[0].toString())]
          );
          assert.equal(motion.isPassing, ProposalStatus.Failing);
          done();
        });
      });
    });
  });

  describe('elections', () => {
    let subscription = null;
    beforeEach((done) => {
      api = new MockApi();
      done();
    });

    afterEach((done) => {
      subscription.unsubscribe();
      deloadChain('elections', 'accounts');
      done();
    });

    it('should convert council data to SubstrateElection', (done) => {
      // set up chain state
      api.addQuery('elections', 'candidates').next(createType('Vec<AccountId>', [api.accounts[2]]));
      api.addDerive('elections', 'voters').next([[api.accounts[3]]]);
      api.addDerive('elections', 'voterPositions').next({
        [api.accounts[3].toString()]: {
          globalIndex: new u32(0),
          index: new u32(0),
          setIndex: new u32(0),
        }
      });
      api.addQuery('elections', 'nextFinalize').next(toOption());
      api.addQuery('elections', 'leaderboard').next(toOption());
      api.addDerive('elections', 'approvalsOf').next([[true]]);
      api.addQuery('elections', 'voteCount').next(createType('VoteIndex', 1));
      api.addQuery('elections', 'voterInfoOf').next(toOption(
        createType('VoterInfo', {
          lastActive: createType('VoteIndex', 1),
          lastWin: createType('VoteIndex', 0),
          pot: new u128(0),
          stake: new u128(api.balances[api.accounts[3].toString()]),
        })
      ));

      loadChain('elections', () => {
        subscription = (app.chain as Edgeware).elections.store.getObservable().subscribe((storeUpdate) => {
          if (storeUpdate.updateType === UpdateType.Update) {
            const election = storeUpdate.item;
            assert.deepEqual(election.data, {
              identifier: '1',
              voteIndex: 1
            });
            assert.isFalse((app.chain as Edgeware).elections.activeElection.isPresentationPhase);
            assert.deepEqual(
              Object.keys((app.chain as Edgeware).elections.voters),
              [api.accounts[3].toString()]
            );
            const voter = app.chain.accounts.get(api.accounts[3].toString());
            assert.deepEqual(
              (app.chain as Edgeware).elections.activeElection.getVotes(voter)[0].votes,
              [true]
            );
            done();
          }
        });
      });
      // TODO: write a test that actually completes an election
    });
  });

  describe('identities', () => {
    let subscription = null;
    beforeEach((done) => {
      api = new MockApi();
      done();
    });
    afterEach((done) => {
      subscription.unsubscribe();
      deloadChain('identities', 'accounts');
      done();
    });

    it('should convert identity data to EdgewareIdentity', (done) => {
      // set up chain state
      const hash = createType('Hash', [1]);
      api.addQuery('identity', 'identities').next(createType('Vec<H256>', [hash]));
      api.addQuery('identity', 'identityOf').next(toOption(
        new IdentityRecord({
          account: api.accounts[0],
          identity_type: createType('Text', 'github'),
          identity: createType('Bytes', 'drewstone'),
          stage: new EdgeIdentityStage('Attested'),
          expiration_time: createType('Moment', 100),
          proof: createType('Text', 'abcdef'),
          metadata: null,
        })
      ));

      loadChain('identities', () => {
        subscription = (app.chain as Edgeware).identities.store.getObservable().subscribe((storeUpdate) => {
          const identity = storeUpdate.item;
          assert.deepEqual(identity.data, {
            identifier: hash.toString(),
            hash: hash.toString(),
            username: 'drewstone',
            account: api.accounts[0].toString(),
          });

          assert.equal(identity.stage, IdentityStage.Attested);
          assert.equal(identity.proofLink, 'abcdef');
          assert.equal(identity.expirationTime.unix(), moment(100).unix());
          assert.isFalse(identity.completed);
          done();
        });
      });
    });
  });
});
*/
