/* eslint-disable @typescript-eslint/no-explicit-any */
import chai from 'chai';
import {
  AccountId,
  BalanceOf,
  Registration,
  RegistrarInfo,
  TreasuryProposal,
  Proposal,
  Votes,
  Bounty,
  OpenTip,
} from '@polkadot/types/interfaces';
import { Vec, Data, TypeRegistry, Bytes } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { stringToHex } from '@polkadot/util';
import { DeriveReferendum } from '@polkadot/api-derive/democracy/types';
import { DeriveBounty } from '@polkadot/api-derive/types';

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
  IdentityJudgement,
  ITreasuryBountyProposed,
  ITreasuryBountyBecameActive,
  INewTip,
  ITipVoted,
  ITipClosing,
} from '../../../src/substrate/types';
import { StorageFetcher } from '../../../src/substrate/storageFetcher';

import {
  constructFakeApi,
  constructOption,
  constructIdentityJudgement,
} from './testUtil';

const { assert } = chai;

const blockNumber = 10;

const api = constructFakeApi({
  getHeader: async () => ({
    number: blockNumber,
  }),

  // identities
  identityOfMulti: async (addrs) =>
    addrs.map((addr, i) => {
      if (i === 1) return constructOption();
      if (addr === 'dave')
        return constructOption(({
          info: {
            // NO DISPLAY NAME SET
            web: new Data(new TypeRegistry(), {
              Raw: stringToHex(`${addr}-display-name`),
            }),
          },
          judgements: [],
        } as unknown) as Registration);
      return constructOption(({
        info: {
          display: new Data(new TypeRegistry(), {
            Raw: stringToHex(`${addr}-display-name`),
          }),
        },
        judgements:
          addr !== 'charlie'
            ? [
                [0, constructIdentityJudgement(IdentityJudgement.KnownGood)],
                [1, constructIdentityJudgement(IdentityJudgement.Erroneous)],
              ]
            : [],
      } as unknown) as Registration);
    }),
  registrars: async () => [
    constructOption(({ account: 'charlie' } as unknown) as RegistrarInfo),
    constructOption(({ account: 'dave' } as unknown) as RegistrarInfo),
  ],

  // democracy proposals
  publicProps: async () => [[1, 'hash1', 'Charlie']],
  depositOf: async (idx) =>
    idx !== 1
      ? constructOption()
      : constructOption((['100', ['Alice']] as unknown) as [
          BalanceOf,
          Vec<AccountId>
        ] &
          Codec),

  // democracy referenda
  referendumsActive: async () => [
    ({
      index: '3',
      imageHash: 'image-hash-2',
      status: {
        threshold: 'Supermajorityapproval',
        end: '100',
      },
    } as unknown) as DeriveReferendum,
  ],
  dispatchQueue: async () => [
    {
      index: '2',
      at: '50',
      imageHash: 'image-hash-1',
    },
  ],

  // democracy preimages
  preimages: async (hashes) =>
    hashes.map((hash) =>
      hash === 'image-hash-1'
        ? {
            at: '10',
            proposer: 'Alice',
            proposal: {
              method: 'method-1',
              section: 'section-1',
              args: ['arg-1-1', 'arg-1-2'],
            },
          }
        : hash === 'hash1'
        ? {
            at: '20',
            proposer: 'Bob',
            proposal: {
              method: 'method-2',
              section: 'section-2',
              args: ['arg-2-1', 'arg-2-2'],
            },
          }
        : null
    ),

  // treasury proposals
  treasuryApprovals: async () => ['0', '1', '2'],
  treasuryProposalCount: async () => '4',
  treasuryProposalsMulti: async (ids) =>
    ids.length === 1 && +ids[0] === 3
      ? [
          constructOption(({
            proposer: 'Alice',
            value: 50,
            beneficiary: 'Bob',
            bond: 5,
          } as unknown) as TreasuryProposal),
        ]
      : [], // should not see anything else

  // bounty proposals
  bountyApprovals: async () => ['0', '1', '2'],
  bountyCount: async () => '3',
  bountiesMulti: async (ids) =>
    ids.length === 1 && +ids[0] === 3
      ? [
          constructOption(({
            proposer: 'alice',
            value: 50,
            fee: 10,
            curatorDeposit: 10,
            bond: 10,
            status: {},
          } as unknown) as Bounty),
        ]
      : [], // should not see anything else
  bounties: async () => [
    ({
      bounty: {
        proposer: 'alice',
        value: 50,
        fee: 10,
        curatorDeposit: 10,
        bond: 10,
        status: 'Proposed',
      },
      description: 'hello',
      index: 0,
      proposals: [{}],
    } as unknown) as DeriveBounty,
  ],

  // collective proposals
  collectiveProposals: async () => ['council-hash2', 'council-hash'],
  votingMulti: async () => [
    constructOption(),
    constructOption(({
      index: '15',
      threshold: '4',
      ayes: ['Alice'],
      nays: ['Bob'],
    } as unknown) as Votes),
  ],
  collectiveProposalOf: async (h) => {
    if (h !== 'council-hash') {
      throw new Error('invalid council proposal');
    } else {
      return constructOption(({
        method: 'proposal-method',
        section: 'proposal-section',
        args: ['proposal-arg-1', 'proposal-arg-2'],
      } as unknown) as Proposal);
    }
  },

  // tips
  tipsKeys: async () => [
    { args: ['tip-hash-1'] },
    { args: ['tip-hash-2'] },
    { args: ['tip-hash-3'] },
  ],
  getStorage: async (key) => {
    if (key?.args[0] === 'tip-hash-1') {
      return constructOption(({
        reason: 'reasonHash1',
        who: 'alice',
        finder: 'bob',
        deposit: '1000',
        tips: [],
        closes: constructOption(),
        findersFee: {
          valueOf: () => true,
        },
      } as unknown) as OpenTip);
    }
    if (key?.args[0] === 'tip-hash-2') {
      return constructOption(({
        reason: 'reasonHash2',
        who: 'charlie',
        finder: 'dave',
        deposit: '999',
        tips: [
          ['eve', '3'],
          ['ferdie', '4'],
        ],
        closes: constructOption('123' as any),
        findersFee: {
          valueOf: () => false,
        },
      } as unknown) as OpenTip);
    }
    throw new Error('UNKNOWN STORAGE ITEM');
  },
  tipReasons: async (hash) =>
    hash === 'reasonHash1'
      ? constructOption((stringToHex('hello world!') as unknown) as Bytes)
      : constructOption((stringToHex('goodbye world!') as unknown) as Bytes),

  // signaling proposals
  inactiveProposals: async () => [['inactive-hash', '100']],
  activeProposals: async () => [['active-hash', '200']],
  completedProposals: async () => [['completed-hash', '10']],
  signalingProposalOf: async (hash) =>
    hash === 'inactive-hash'
      ? constructOption({
          author: 'Inactive Author',
          title: 'inactive',
          contents: 'inactive contents',
          vote_id: '1',
          stage: {
            isCommit: false,
            isVoting: false,
            isCompleted: false,
          },
        } as any)
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
          },
        } as any)
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
          },
        } as any)
      : constructOption(),
  voteRecords: async (id) =>
    id === '1'
      ? constructOption({
          id: 1,
          outcomes: ['inactive1', 'inactive2'],
          data: {
            tally_type: 'inactive tally',
            vote_type: 'inactive vote',
          },
        } as any)
      : id === '2'
      ? constructOption({
          id: 2,
          outcomes: ['active1', 'active2'],
          data: {
            tally_type: 'active tally',
            vote_type: 'active vote',
          },
        } as any)
      : id === '3'
      ? constructOption({
          id: 3,
          outcomes: ['completed1', 'completed2'],
          data: {
            tally_type: 'completed tally',
            vote_type: 'completed vote',
          },
        } as any)
      : constructOption(),
});

/* eslint-disable: dot-notation */
describe('Edgeware Event Migration Tests', () => {
  it('should generate proposal events events', async () => {
    const fetcher = new StorageFetcher(api);
    const events = await fetcher.fetch();
    assert.sameDeepMembers(events, [
      {
        blockNumber,
        data: {
          kind: EventKind.DemocracyProposed,
          proposalIndex: 1,
          proposalHash: 'hash1',
          proposer: 'Charlie',
          deposit: '100',
        } as IDemocracyProposed,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.DemocracyStarted,
          referendumIndex: 3,
          proposalHash: 'image-hash-2',
          voteThreshold: 'Supermajorityapproval',
          endBlock: 100,
        } as IDemocracyStarted,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.DemocracyStarted,
          referendumIndex: 2,
          proposalHash: 'image-hash-1',
          voteThreshold: '',
          endBlock: 0,
        } as IDemocracyStarted,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.DemocracyPassed,
          referendumIndex: 2,
          dispatchBlock: 50,
        } as IDemocracyPassed,
      },
      {
        blockNumber: 10,
        data: {
          kind: EventKind.PreimageNoted,
          proposalHash: 'image-hash-1',
          noter: 'Alice',
          preimage: {
            method: 'method-1',
            section: 'section-1',
            args: ['arg-1-1', 'arg-1-2'],
          },
        } as IPreimageNoted,
      },
      {
        blockNumber: 20,
        data: {
          kind: EventKind.PreimageNoted,
          proposalHash: 'hash1',
          noter: 'Bob',
          preimage: {
            method: 'method-2',
            section: 'section-2',
            args: ['arg-2-1', 'arg-2-2'],
          },
        } as IPreimageNoted,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.TreasuryProposed,
          proposalIndex: 3,
          proposer: 'Alice',
          value: '50',
          beneficiary: 'Bob',
          bond: '5',
        } as ITreasuryProposed,
      },
      {
        blockNumber,
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
            args: ['proposal-arg-1', 'proposal-arg-2'],
          },
        } as ICollectiveProposed,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.CollectiveVoted,
          collectiveName: 'council',
          proposalHash: 'council-hash',
          voter: 'Alice',
          vote: true,
        } as ICollectiveVoted,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.CollectiveVoted,
          collectiveName: 'council',
          proposalHash: 'council-hash',
          voter: 'Bob',
          vote: false,
        } as ICollectiveVoted,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.SignalingNewProposal,
          proposer: 'Inactive Author',
          proposalHash: 'inactive-hash',
          voteId: '1',
          title: 'inactive',
          description: 'inactive contents',
          tallyType: 'inactive tally',
          voteType: 'inactive vote',
          choices: ['inactive1', 'inactive2'],
        } as ISignalingNewProposal,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.SignalingNewProposal,
          proposer: 'Active Author',
          proposalHash: 'active-hash',
          voteId: '2',
          title: 'active',
          description: 'active contents',
          tallyType: 'active tally',
          voteType: 'active vote',
          choices: ['active1', 'active2'],
        } as ISignalingNewProposal,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.SignalingNewProposal,
          proposer: 'Completed Author',
          proposalHash: 'completed-hash',
          voteId: '3',
          title: 'completed',
          description: 'completed contents',
          tallyType: 'completed tally',
          voteType: 'completed vote',
          choices: ['completed1', 'completed2'],
        } as ISignalingNewProposal,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.SignalingVotingStarted,
          proposalHash: 'active-hash',
          voteId: '2',
          endBlock: 250,
        } as ISignalingVotingStarted,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.SignalingVotingStarted,
          proposalHash: 'completed-hash',
          voteId: '3',
          endBlock: 100,
        } as ISignalingVotingStarted,
      },
      {
        blockNumber,
        data: {
          kind: EventKind.SignalingVotingCompleted,
          proposalHash: 'completed-hash',
          voteId: '3',
        } as ISignalingVotingCompleted,
      },
      {
        blockNumber,
        data: {
          kind: 'treasury-bounty-proposed',
          bountyIndex: 0,
          proposer: 'alice',
          value: '50',
          fee: '10',
          curatorDeposit: '10',
          bond: '10',
          description: 'hello',
        } as ITreasuryBountyProposed,
      },
      {
        blockNumber,
        data: {
          kind: 'treasury-bounty-became-active',
          bountyIndex: 0,
        } as ITreasuryBountyBecameActive,
      },
      {
        blockNumber,
        data: {
          kind: 'new-tip',
          proposalHash: 'tip-hash-1',
          who: 'alice',
          reason: 'hello world!',
          finder: 'bob',
          deposit: '1000',
          findersFee: true,
        } as INewTip,
      },
      {
        blockNumber,
        data: {
          kind: 'new-tip',
          proposalHash: 'tip-hash-2',
          who: 'charlie',
          reason: 'goodbye world!',
          finder: 'dave',
          deposit: '999',
          findersFee: false,
        } as INewTip,
      },
      {
        blockNumber,
        data: {
          kind: 'tip-voted',
          proposalHash: 'tip-hash-2',
          who: 'eve',
          value: '3',
        } as ITipVoted,
      },
      {
        blockNumber,
        data: {
          kind: 'tip-voted',
          proposalHash: 'tip-hash-2',
          who: 'ferdie',
          value: '4',
        } as ITipVoted,
      },
      {
        blockNumber,
        data: {
          kind: 'tip-closing',
          proposalHash: 'tip-hash-2',
          closing: 123,
        } as ITipClosing,
      },
    ]);
  });

  it('should generate identity-set events', async () => {
    const fetcher = new StorageFetcher(api);
    const events = await fetcher.fetchIdentities([
      'alice',
      'bob',
      'charlie',
      'dave',
    ]);
    assert.sameDeepMembers(events, [
      {
        blockNumber,
        data: {
          kind: EventKind.IdentitySet,
          who: 'alice',
          displayName: 'alice-display-name',
          judgements: [
            ['charlie', IdentityJudgement.KnownGood],
            ['dave', IdentityJudgement.Erroneous],
          ],
        },
      },
      {
        blockNumber,
        data: {
          kind: EventKind.IdentitySet,
          who: 'charlie',
          displayName: 'charlie-display-name',
          judgements: [],
        },
      },
    ]);
  });
});
