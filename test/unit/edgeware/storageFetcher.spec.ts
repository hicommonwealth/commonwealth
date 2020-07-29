import chai from 'chai';
import {
  AccountId, BalanceOf, Registration, RegistrarInfo
} from '@polkadot/types/interfaces';
import { Vec, Data, TypeRegistry } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { stringToHex } from '@polkadot/util';
import { DeriveReferendum } from '@polkadot/api-derive/democracy/types';
import { ProposalRecord, VoteRecord } from '@edgeware/node-types/interfaces/types';

import { constructFakeApi, constructOption, constructIdentityJudgement } from './testUtil';
import {
  EventKind,
  IDemocracyProposed,
  IDemocracyStarted,
  IDemocracyPassed,
  IPreimageNoted,
  ITreasuryProposed,
  ICollectiveProposed,
  ISignalingNewProposal,
  ISignalingVotingStarted,
  ISignalingVotingCompleted,
  ICollectiveVoted,
  IdentityJudgement
} from '../../../src/substrate/types';
import { StorageFetcher } from '../../../src/substrate/storageFetcher';

const { assert } = chai;

const blockNumber = 10;
const api = constructFakeApi({
  getHeader: async () => ({
    number: blockNumber,
  }),

  // identities
  identityOfMulti: async (addrs) => addrs.map((addr, i) => {
    if (i === 1) return constructOption();
    return constructOption({
      info: {
        display: new Data(new TypeRegistry(), { Raw: stringToHex(`${addr}-display-name`) }),
      },
      judgements: addr !== 'charlie' ? [
        [ 0, constructIdentityJudgement(IdentityJudgement.KnownGood) ],
        [ 1, constructIdentityJudgement(IdentityJudgement.Erroneous) ],
      ] : [

      ],
    } as unknown as Registration)
  }),
  registrars: async () => [
    constructOption({ account: 'charlie' } as unknown as RegistrarInfo),
    constructOption({ account: 'dave' } as unknown as RegistrarInfo),
  ],

  // democracy proposals
  publicProps: async () => [
    [ 1, 'hash1', 'Charlie' ],
  ],
  depositOf: async (idx) => idx !== 1
    ? constructOption()
    : constructOption([ '100', [ 'Alice' ] ] as unknown as [ BalanceOf, Vec<AccountId> ] & Codec),

  // democracy referenda
  referendumsActive: async () => [{
    index: '3',
    imageHash: 'image-hash-2',
    status: {
      threshold: 'Supermajorityapproval',
      end: '100',
    }
  } as unknown as DeriveReferendum],
  dispatchQueue: async () => [{
    index: '2',
    at: '50',
    imageHash: 'image-hash-1',
  }],

  // democracy preimages
  preimages: async (hashes) => hashes.map((hash) => hash === 'image-hash-1'
    ? ({
      at: '10',
      proposer: 'Alice',
      proposal: {
        methodName: 'method-1',
        sectionName: 'section-1',
        args: [ 'arg-1-1', 'arg-1-2' ],
      }
    })
    : hash === 'hash1'
      ? ({
        at: '20',
        proposer: 'Bob',
        proposal: {
          methodName: 'method-2',
          sectionName: 'section-2',
          args: [ 'arg-2-1', 'arg-2-2' ],
        }
      })
      : null),

  // treasury proposals
  treasuryProposalsDerive: async () => ({ proposals: [{
    id: '20',
    proposal: {
      proposer: 'Alice',
      value: 50,
      beneficiary: 'Bob',
      bond: 5,
    }
  }] }),

  // collective proposals
  councilProposalsDerive: async () => [{
    votes: {
      index: '15',
      threshold: '4',
      ayes: ['Alice'],
      nays: ['Bob'],
    },
    hash: 'council-hash',
    proposal: {
      methodName: 'proposal-method',
      sectionName: 'proposal-section',
      args: [ 'proposal-arg-1', 'proposal-arg-2' ],
    }
  }],

  // signaling proposals
  inactiveProposals: async () => [
    [ 'inactive-hash', '100']
  ],
  activeProposals: async () => [
    [ 'active-hash', '200']
  ],
  completedProposals: async () => [
    [ 'completed-hash', '10']
  ],
  signalingProposalOf: async (hash) => hash === 'inactive-hash'
    ? constructOption({
      author: 'Inactive Author',
      title: 'inactive',
      contents: 'inactive contents',
      vote_id: '1',
      stage: {
        isCommit: false,
        isVoting: false,
        isCompleted: false,
      }
    } as unknown as ProposalRecord)
    : hash === 'active-hash'
      ? constructOption({
        author: 'Active Author',
        title: 'active',
        contents: 'active contents',
        vote_id: '2',
        transition_time: '250',
        stage: {
          isCommit: false,
          isVoting: true,
          isCompleted: false,
        }
      } as unknown as ProposalRecord)
      : hash === 'completed-hash'
        ? constructOption({
          author: 'Completed Author',
          title: 'completed',
          contents: 'completed contents',
          vote_id: '3',
          transition_time: '100',
          stage: {
            isCommit: false,
            isVoting: false,
            isCompleted: true,
          }
        } as unknown as ProposalRecord) : constructOption(),
  voteRecords: async (id) => id === '1'
    ? constructOption({
      id: 1,
      outcomes: [ 'inactive1', 'inactive2' ],
      data: {
        tally_type: 'inactive tally',
        vote_type: 'inactive vote',
      }
    } as unknown as VoteRecord)
    : id === '2'
      ? constructOption({
        id: 2,
        outcomes: [ 'active1', 'active2' ],
        data: {
          tally_type: 'active tally',
          vote_type: 'active vote',
        }
      } as unknown as VoteRecord)
      : id === '3'
        ? constructOption({
          id: 3,
          outcomes: [ 'completed1', 'completed2' ],
          data: {
            tally_type: 'completed tally',
            vote_type: 'completed vote',
          }
        } as unknown as VoteRecord) : constructOption(),
});

/* eslint-disable: dot-notation */
describe('Edgeware Event Migration Tests', () => {
  it('should generate proposal events events', async () => {
    const fetcher = new StorageFetcher(api);
    const events = await fetcher.fetch();
    assert.sameDeepMembers(events, [
      { blockNumber,
        data: {
          kind: EventKind.DemocracyProposed,
          proposalIndex: 1,
          proposalHash: 'hash1',
          proposer: 'Charlie',
          deposit: '100',
        } as IDemocracyProposed
      },
      { blockNumber,
        data: {
          kind: EventKind.DemocracyStarted,
          referendumIndex: 3,
          proposalHash: 'image-hash-2',
          voteThreshold: 'Supermajorityapproval',
          endBlock: 100,
        } as IDemocracyStarted
      },
      { blockNumber,
        data: {
          kind: EventKind.DemocracyStarted,
          referendumIndex: 2,
          proposalHash: 'image-hash-1',
          voteThreshold: '',
          endBlock: 0,
        } as IDemocracyStarted
      },
      { blockNumber,
        data: {
          kind: EventKind.DemocracyPassed,
          referendumIndex: 2,
          dispatchBlock: 50,
        } as IDemocracyPassed
      },
      { blockNumber: 10,
        data: {
          kind: EventKind.PreimageNoted,
          proposalHash: 'image-hash-1',
          noter: 'Alice',
          preimage: {
            method: 'method-1',
            section: 'section-1',
            args: [ 'arg-1-1', 'arg-1-2' ],
          }
        } as IPreimageNoted
      },
      { blockNumber: 20,
        data: {
          kind: EventKind.PreimageNoted,
          proposalHash: 'hash1',
          noter: 'Bob',
          preimage: {
            method: 'method-2',
            section: 'section-2',
            args: [ 'arg-2-1', 'arg-2-2' ],
          }
        } as IPreimageNoted
      },
      { blockNumber,
        data: {
          kind: EventKind.TreasuryProposed,
          proposalIndex: 20,
          proposer: 'Alice',
          value: '50',
          beneficiary: 'Bob',
          bond: '5',
        } as ITreasuryProposed
      },
      { blockNumber,
        data: {
          kind: EventKind.CollectiveProposed,
          collectiveName: 'council',
          proposalIndex: 15,
          proposalHash: 'council-hash',
          proposer: '',
          threshold: 4,
          call: {
            method: 'proposal-method',
            section: 'proposal-section',
            args: [ 'proposal-arg-1', 'proposal-arg-2' ],
          }
        } as ICollectiveProposed
      },
      { blockNumber,
        data: {
          kind: EventKind.CollectiveVoted,
          collectiveName: 'council',
          proposalHash: 'council-hash',
          voter: 'Alice',
          vote: true,
        } as ICollectiveVoted
      },
      { blockNumber,
        data: {
          kind: EventKind.CollectiveVoted,
          collectiveName: 'council',
          proposalHash: 'council-hash',
          voter: 'Bob',
          vote: false,
        } as ICollectiveVoted
      },
      { blockNumber,
        data: {
          kind: EventKind.SignalingNewProposal,
          proposer: 'Inactive Author',
          proposalHash: 'inactive-hash',
          voteId: '1',
          title: 'inactive',
          description: 'inactive contents',
          tallyType: 'inactive tally',
          voteType: 'inactive vote',
          choices: [ 'inactive1', 'inactive2' ],
        } as ISignalingNewProposal
      },
      { blockNumber,
        data: {
          kind: EventKind.SignalingNewProposal,
          proposer: 'Active Author',
          proposalHash: 'active-hash',
          voteId: '2',
          title: 'active',
          description: 'active contents',
          tallyType: 'active tally',
          voteType: 'active vote',
          choices: [ 'active1', 'active2' ],
        } as ISignalingNewProposal
      },
      { blockNumber,
        data: {
          kind: EventKind.SignalingNewProposal,
          proposer: 'Completed Author',
          proposalHash: 'completed-hash',
          voteId: '3',
          title: 'completed',
          description: 'completed contents',
          tallyType: 'completed tally',
          voteType: 'completed vote',
          choices: [ 'completed1', 'completed2' ],
        } as ISignalingNewProposal
      },
      { blockNumber,
        data: {
          kind: EventKind.SignalingVotingStarted,
          proposalHash: 'active-hash',
          voteId: '2',
          endBlock: 250,
        } as ISignalingVotingStarted
      },
      { blockNumber,
        data: {
          kind: EventKind.SignalingVotingStarted,
          proposalHash: 'completed-hash',
          voteId: '3',
          endBlock: 100,
        } as ISignalingVotingStarted
      },
      { blockNumber,
        data: {
          kind: EventKind.SignalingVotingCompleted,
          proposalHash: 'completed-hash',
          voteId: '3',
        } as ISignalingVotingCompleted
      },
    ]);
  });

  it('should generate identity-set events events', async () => {
    const fetcher = new StorageFetcher(api);
    const events = await fetcher.fetchIdentities(['alice', 'bob', 'charlie']);
    assert.sameDeepMembers(events, [
      {
        blockNumber,
        data: {
          kind: EventKind.IdentitySet,
          who: 'alice',
          displayName: 'alice-display-name',
          judgements: [ [ 'charlie', IdentityJudgement.KnownGood ], [ 'dave', IdentityJudgement.Erroneous ] ],
        }
      },
      {
        blockNumber,
        data: {
          kind: EventKind.IdentitySet,
          who: 'charlie',
          displayName: 'charlie-display-name',
          judgements: [ ],
        }
      },
    ])
  });
});
