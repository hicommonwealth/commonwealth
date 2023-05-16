/* eslint-disable @typescript-eslint/no-explicit-any */
import chai from 'chai';
import BN from 'bn.js';
import type {
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
import type { Vec, Bytes } from '@polkadot/types';
import { Data, TypeRegistry } from '@polkadot/types';
import type { Codec } from '@polkadot/types/types';
import { stringToHex } from '@polkadot/util';
import type { DeriveReferendum } from '@polkadot/api-derive/democracy/types';
import type { DeriveBounty } from '@polkadot/api-derive/types';

import { SupportedNetwork } from '../../../src';
import type {
  IDemocracyProposed,
  IDemocracyStarted,
  IDemocracyPassed,
  IPreimageNoted,
  ITreasuryProposed,
  INewTip,
  ITipVoted,
  ITipClosing,
} from 'chain-events/src/chain-bases/substrate/types';
import {
  EventKind,
  IdentityJudgement,
} from 'chain-events/src/chain-bases/substrate/types';
import { StorageFetcher } from 'chain-events/src/chain-bases/substrate/storageFetcher';

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
        return constructOption({
          info: {
            // NO DISPLAY NAME SET
            web: new Data(new TypeRegistry(), {
              Raw: stringToHex(`${addr}-display-name`),
            }),
          },
          judgements: [],
        } as unknown as Registration);
      return constructOption({
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
      } as unknown as Registration);
    }),
  registrars: async () => [
    constructOption({ account: 'charlie' } as unknown as RegistrarInfo),
    constructOption({ account: 'dave' } as unknown as RegistrarInfo),
  ],

  // democracy proposals
  publicProps: async () => [[1, 'hash1', 'Charlie']],
  depositOf: async (idx) =>
    idx !== 1
      ? constructOption()
      : constructOption([new BN('100'), ['Alice']] as unknown as [
          BalanceOf,
          Vec<AccountId>
        ] &
          Codec),

  // democracy referenda
  referendumsActive: async () => [
    {
      index: '3',
      imageHash: 'image-hash-2',
      status: {
        threshold: 'Supermajorityapproval',
        end: '100',
      },
    } as unknown as DeriveReferendum,
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
          constructOption({
            proposer: 'Alice',
            value: 50,
            beneficiary: 'Bob',
            bond: 5,
          } as unknown as TreasuryProposal),
        ]
      : [], // should not see anything else

  // bounty proposals
  bountyApprovals: async () => ['0', '1', '2'],
  bountyCount: async () => '3',
  bountiesMulti: async (ids) =>
    ids.length === 1 && +ids[0] === 3
      ? [
          constructOption({
            proposer: 'alice',
            value: 50,
            fee: 10,
            curatorDeposit: 10,
            bond: 10,
            status: {},
          } as unknown as Bounty),
        ]
      : [], // should not see anything else
  bounties: async () => [
    {
      bounty: {
        proposer: 'alice',
        value: 50,
        fee: 10,
        curatorDeposit: 10,
        bond: 10,
        status: {
          isPendingPayout: false,
          asActive: {
            curator: 'bob',
            updateDue: 200,
          },
          isActive: true,
        },
      },
      description: 'hello',
      index: 0,
      proposals: [{}],
    } as unknown as DeriveBounty,
  ],

  // collective proposals
  collectiveProposals: async () => ['council-hash2', 'council-hash'],
  votingMulti: async () => [
    constructOption(),
    constructOption({
      index: '15',
      threshold: '4',
      ayes: ['Alice'],
      nays: ['Bob'],
    } as unknown as Votes),
  ],
  collectiveProposalOf: async (h) => {
    if (h !== 'council-hash') {
      throw new Error('invalid council proposal');
    } else {
      return constructOption({
        method: 'proposal-method',
        section: 'proposal-section',
        args: ['proposal-arg-1', 'proposal-arg-2'],
      } as unknown as Proposal);
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
      return constructOption({
        reason: 'reasonHash1',
        who: 'alice',
        finder: 'bob',
        deposit: '1000',
        tips: [],
        closes: constructOption(),
        findersFee: {
          valueOf: () => true,
        },
      } as unknown as OpenTip);
    }
    if (key?.args[0] === 'tip-hash-2') {
      return constructOption({
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
      } as unknown as OpenTip);
    }
    throw new Error('UNKNOWN STORAGE ITEM');
  },
  tipReasons: async (hash) =>
    hash === 'reasonHash1'
      ? constructOption(stringToHex('hello world!') as unknown as Bytes)
      : constructOption(stringToHex('goodbye world!') as unknown as Bytes),
});

/* eslint-disable: dot-notation */
describe('Edgeware Event Migration Tests', () => {
  it('should generate proposal events events', async () => {
    const fetcher = new StorageFetcher(api);
    const events = await fetcher.fetch();
    assert.sameDeepMembers(
      events.sort(
        (p1, p2) =>
          p1.data.kind.localeCompare(p2.data.kind) ||
          p1.blockNumber - p2.blockNumber
      ),
      [
        {
          blockNumber,
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
          data: {
            kind: EventKind.DemocracyPassed,
            referendumIndex: 2,
            dispatchBlock: 50,
          } as IDemocracyPassed,
        },
        {
          blockNumber: 10,
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
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
          network: SupportedNetwork.Substrate,
          data: {
            kind: 'tip-voted',
            proposalHash: 'tip-hash-2',
            who: 'eve',
            value: '3',
          } as ITipVoted,
        },
        {
          blockNumber,
          network: SupportedNetwork.Substrate,
          data: {
            kind: 'tip-voted',
            proposalHash: 'tip-hash-2',
            who: 'ferdie',
            value: '4',
          } as ITipVoted,
        },
        {
          blockNumber,
          network: SupportedNetwork.Substrate,
          data: {
            kind: 'tip-closing',
            proposalHash: 'tip-hash-2',
            closing: 123,
          } as ITipClosing,
        },
      ].sort(
        (p1, p2) =>
          p1.data.kind.localeCompare(p2.data.kind) ||
          p1.blockNumber - p2.blockNumber
      )
    );
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
        network: SupportedNetwork.Substrate,
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
        network: SupportedNetwork.Substrate,
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
