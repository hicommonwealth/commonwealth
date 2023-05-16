/* eslint-disable @typescript-eslint/no-explicit-any */
import chai from 'chai';
import BN from 'bn.js';
import type {
  AccountId,
  PropIndex,
  Hash,
  ReferendumInfoTo239,
  ReferendumInfo,
  Proposal,
  TreasuryProposal,
  Votes,
  Event,
  Extrinsic,
  Registration,
  RegistrarInfo,
  Bounty,
  RewardPoint,
  OpenTip,
} from '@polkadot/types/interfaces';
import type {
  DeriveDispatch,
  DeriveProposalImage,
  DeriveBounties,
} from '@polkadot/api-derive/types';
import type { Vec, bool, Option, Bytes } from '@polkadot/types';
import { Data, TypeRegistry } from '@polkadot/types';
import type { Codec, ITuple, TypeDef } from '@polkadot/types/types';
import { stringToHex } from '@polkadot/util';
import type {
  OffenceDetails,
  ReportIdOf,
} from '@polkadot/types/interfaces/offences';

import { SupportedNetwork } from '../../../src';
import { Enrich } from 'chain-events/src/chain-bases/substrate/filters/enricher';
import {
  EventKind,
  IdentityJudgement,
} from 'chain-events/src/chain-bases/substrate/types';

import {
  constructFakeApi,
  constructOption,
  constructIdentityJudgement,
  constructAccountVote,
} from './testUtil';

const { assert } = chai;
const offenceDetails = [
  constructOption({
    offender: ['charlie', { total: 0, own: 0, others: 0 }],
    reporters: ['alice', 'dave'],
  } as unknown as Option<OffenceDetails>),
];
const blockNumber = 10;
const api = constructFakeApi({
  totalIssuance: async () => new BN(1_000_000),
  electionRounds: async () => '10',
  electionMembers: async () => [['dave'], ['charlie'], ['eve']],
  activeEra: async () => '5',
  getBlockHash: async () => {
    return 'hash';
  },
  validators: async () => {
    return {
      validators: [
        'EXkCSUQ6Z1hKvGWMNkUDKrTMVHRduQHWc8G6vgo4NccUmhU',
        'FnWdLnFhRuphztWJJLoNV4zc18dBsjpaAMboPLhLdL7zZp3',
        'EZ7uBY7ZLohavWAugjTSUVVSABLfad77S6RQf4pDe3cV9q4',
        'GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu',
        'DbuPiksDXhFFEWgjsEghUypTJjQKyULiNESYji3Gaose2NV',
        'Gt6HqWBhdu4Sy1u8ASTbS1qf2Ac5gwdegwr8tWN8saMxPt5',
        'JKmFAAo9QbR9w3cfSYxk7zdpNEXaN1XbX4NcMU1okAdpwYx',
      ],
      nextElected: [
        'EXkCSUQ6Z1hKvGWMNkUDKrTMVHRduQHWc8G6vgo4NccUmhU',
        'FnWdLnFhRuphztWJJLoNV4zc18dBsjpaAMboPLhLdL7zZp3',
        'EZ7uBY7ZLohavWAugjTSUVVSABLfad77S6RQf4pDe3cV9q4',
        'GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu',
        'DbuPiksDXhFFEWgjsEghUypTJjQKyULiNESYji3Gaose2NV',
        'Gt6HqWBhdu4Sy1u8ASTbS1qf2Ac5gwdegwr8tWN8saMxPt5',
        'JKmFAAo9QbR9w3cfSYxk7zdpNEXaN1XbX4NcMU1okAdpwYx',
      ],
    };
  },
  'validators.at': async () => {
    return [
      'EXkCSUQ6Z1hKvGWMNkUDKrTMVHRduQHWc8G6vgo4NccUmhU',
      'FnWdLnFhRuphztWJJLoNV4zc18dBsjpaAMboPLhLdL7zZp3',
      'EZ7uBY7ZLohavWAugjTSUVVSABLfad77S6RQf4pDe3cV9q4',
      'GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu',
      'DbuPiksDXhFFEWgjsEghUypTJjQKyULiNESYji3Gaose2NV',
      'Gt6HqWBhdu4Sy1u8ASTbS1qf2Ac5gwdegwr8tWN8saMxPt5',
      'JKmFAAo9QbR9w3cfSYxk7zdpNEXaN1XbX4NcMU1okAdpwYx',
    ];
  },
  'validators.keysAt': async () => {
    return [
      {
        args: ['EXkCSUQ6Z1hKvGWMNkUDKrTMVHRduQHWc8G6vgo4NccUmhU'],
      },
      {
        args: ['EZ7uBY7ZLohavWAugjTSUVVSABLfad77S6RQf4pDe3cV9q4'],
      },
    ];
  },
  electedInfo: async () => {
    return {
      info: [
        {
          accountId: 'GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu',
          controllerId: 'JKmFAAo9QbR9w3cfSYxk7zdpNEXaN1XbX4NcMU1okAdpwYx',
          rewardDestination: 'Staked',
          validatorPrefs: {
            commission: 100000000,
          },
        },
        {
          accountId: 'HOUXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu',
          controllerId: 'IPEFAAo9QbR9w3cfSYxk7zdpNEXaN1XbX4NcMU1okAdpwYx',
          rewardDestination: 'Staked',
          validatorPrefs: {
            commission: 10000000,
          },
        },
      ],
    };
  },
  nextKeys: async () => {
    return [
      'iViUBJg1zFkVqEcNs5AHEmwDxK8LTBgx8LzZpGDrucKsMS3',
      'krYNTkaCusVm4zeq89kkUFSqz7gsna8gzBTAbJzqcm2yDMW',
      'iEd4cXXQizYFjE6bCPiXWkvt7KZ7gGTL9AdKfTdd6VDcKvS',
      'jERvY3Km1t31oJQa1rZZEpGr186KK2ZrNqJFeRTWxXEtnow',
    ];
  },
  currentPoints: async () => {
    return {
      total: 92600,
      individual: {
        GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu: '140',
        HOUXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu: '20',
      },
    };
  },
  stakers: async (accountId) => {
    // %%%
    const validators = {
      EXkCSUQ6Z1hKvGWMNkUDKrTMVHRduQHWc8G6vgo4NccUmhU: {
        others: [
          {
            value: '0x0000000000000005a405328cbfd77c63',
            who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
          },
          {
            value: '0x000000000000001e9e67108749f21184',
            who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
          },
          {
            value: '0x000000000000000d6d6ad68a401e50e9',
            who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
          },
          {
            value: '0x000000000000000014d14b817a75054c',
            who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
          },
          {
            value: '0x0000000000000096c96fada32bab79ca',
            who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
          },
          {
            value: '0x0000000000000001ae015c352661f300',
            who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
          },
        ],
        own: '0x0000000000000000002386f262982729',
        total: '0x0000000000181394a59fde1e31dea1c4',
      },
      FnWdLnFhRuphztWJJLoNV4zc18dBsjpaAMboPLhLdL7zZp3: {
        others: [
          {
            value: '0x0000000000000005a405328cbfd77c63',
            who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
          },
          {
            value: '0x000000000000001e9e67108749f21184',
            who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
          },
          {
            value: '0x000000000000000d6d6ad68a401e50e9',
            who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
          },
          {
            value: '0x000000000000000014d14b817a75054c',
            who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
          },
          {
            value: '0x0000000000000096c96fada32bab79ca',
            who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
          },
          {
            value: '0x0000000000000001ae015c352661f300',
            who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
          },
        ],
        own: '0x0000000000000000002386f262982729',
        total: '0x0000000000181394a59fde1e31dea1c4',
      },
      EZ7uBY7ZLohavWAugjTSUVVSABLfad77S6RQf4pDe3cV9q4: {
        others: [
          {
            value: '0x0000000000000005a405328cbfd77c63',
            who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
          },
          {
            value: '0x000000000000001e9e67108749f21184',
            who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
          },
          {
            value: '0x000000000000000d6d6ad68a401e50e9',
            who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
          },
          {
            value: '0x000000000000000014d14b817a75054c',
            who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
          },
          {
            value: '0x0000000000000096c96fada32bab79ca',
            who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
          },
          {
            value: '0x0000000000000001ae015c352661f300',
            who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
          },
        ],
        own: '0x0000000000000000002386f262982729',
        total: '0x0000000000181394a59fde1e31dea1c4',
      },
      GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu: {
        others: [
          {
            value: '0x0000000000000005a405328cbfd77c63',
            who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
          },
          {
            value: '0x000000000000001e9e67108749f21184',
            who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
          },
          {
            value: '0x000000000000000d6d6ad68a401e50e9',
            who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
          },
          {
            value: '0x000000000000000014d14b817a75054c',
            who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
          },
          {
            value: '0x0000000000000096c96fada32bab79ca',
            who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
          },
          {
            value: '0x0000000000000001ae015c352661f300',
            who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
          },
        ],
        own: '0x0000000000000000002386f262982729',
        total: '0x0000000000181394a59fde1e31dea1c4',
      },
      DbuPiksDXhFFEWgjsEghUypTJjQKyULiNESYji3Gaose2NV: {
        others: [
          {
            value: '0x0000000000000005a405328cbfd77c63',
            who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
          },
          {
            value: '0x000000000000001e9e67108749f21184',
            who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
          },
          {
            value: '0x000000000000000d6d6ad68a401e50e9',
            who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
          },
          {
            value: '0x000000000000000014d14b817a75054c',
            who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
          },
          {
            value: '0x0000000000000096c96fada32bab79ca',
            who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
          },
          {
            value: '0x0000000000000001ae015c352661f300',
            who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
          },
        ],
        own: '0x0000000000000000002386f262982729',
        total: '0x0000000000181394a59fde1e31dea1c4',
      },
      Gt6HqWBhdu4Sy1u8ASTbS1qf2Ac5gwdegwr8tWN8saMxPt5: {
        others: [
          {
            value: '0x0000000000000005a405328cbfd77c63',
            who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
          },
          {
            value: '0x000000000000001e9e67108749f21184',
            who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
          },
          {
            value: '0x000000000000000d6d6ad68a401e50e9',
            who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
          },
          {
            value: '0x000000000000000014d14b817a75054c',
            who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
          },
          {
            value: '0x0000000000000096c96fada32bab79ca',
            who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
          },
          {
            value: '0x0000000000000001ae015c352661f300',
            who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
          },
        ],
        own: '0x0000000000000000002386f262982729',
        total: '0x0000000000181394a59fde1e31dea1c4',
      },
      JKmFAAo9QbR9w3cfSYxk7zdpNEXaN1XbX4NcMU1okAdpwYx: {
        others: [
          {
            value: '0x0000000000000005a405328cbfd77c63',
            who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
          },
          {
            value: '0x000000000000001e9e67108749f21184',
            who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
          },
          {
            value: '0x000000000000000d6d6ad68a401e50e9',
            who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
          },
          {
            value: '0x000000000000000014d14b817a75054c',
            who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
          },
          {
            value: '0x0000000000000096c96fada32bab79ca',
            who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
          },
          {
            value: '0x0000000000000001ae015c352661f300',
            who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
          },
        ],
        own: '0x0000000000000000002386f262982729',
        total: '0x0000000000181394a59fde1e31dea1c4',
      },
    };
    return validators[accountId];
  },
  'stakers.keysAt': async () => {
    const validators = [
      {
        args: ['', 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL'],
      },
      {
        args: ['', 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy'],
      },
    ];
    return validators;
  },
  'stakers.at': async () => {
    return {
      others: [
        {
          value: '0x0000000000000005a405328cbfd77c63',
          who: 'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
        },
        {
          value: '0x000000000000001e9e67108749f21184',
          who: 'iUgUgeVx9WJBea7h8Mm1KGXxurf4UqQfjGVggJ9LfbsMHGy',
        },
        {
          value: '0x000000000000000d6d6ad68a401e50e9',
          who: 'oGmCzvaoZgxV5eMbgVnu6KQACC9snRKttAp3V3obHH7Dc9r',
        },
        {
          value: '0x000000000000000014d14b817a75054c',
          who: 'ks9is3t3uLnSHByPV6idmGVh74aeeABv9VS7g1hSYQBjZFt',
        },
        {
          value: '0x0000000000000096c96fada32bab79ca',
          who: 'nGTjLceLvggC9rZw8mJ3AXSE19o7i7zsLEJkCz3TLNjXfAb',
        },
        {
          value: '0x0000000000000001ae015c352661f300',
          who: 'mxZrFA4exCbd3gX77fMYT88L5S2buvcnne4CrQmjT5b3yDs',
        },
      ],
      own: '0x0000000000000000002386f262982729',
      total: '0x0000000000181394a59fde1e31dea1c4',
    };
  },
  'currentEraPointsEarned.at': async () => {
    const eraPoints = {
      total: 10,
      individual: [5, 5],
    };
    return eraPoints;
  },
  'erasRewardPoints.at': async () => {
    const total = 10;
    const registry = new TypeRegistry();
    const validators = [
      'GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu',
      'mmhaivFqq2gPP6nMpbVoMtxz1H85FVTfn879X5kforz32CL',
    ];
    const individual = [5, 5];

    const eraPoints = registry.createType('EraRewardPoints', {
      individual: new Map<AccountId, RewardPoint>(
        individual
          // eslint-disable-next-line
          // @ts-ignore
          .map((points) => registry.createType('RewardPoint', points))
          .map((points, index): [AccountId, RewardPoint] => [
            validators[index] as unknown as AccountId,
            points,
          ])
      ),
      total,
    });
    return eraPoints;
  },
  'payee.at': async () => 'staked',
  currentEra: async () => constructOption(new BN(12) as unknown as BN & Codec),
  'currentEra.at': async () =>
    constructOption(new BN(12) as unknown as BN & Codec),
  'currentIndex.at': async () => new BN(12),
  concurrentReportsIndex: async () => ['0x00'] as unknown as Vec<ReportIdOf>,
  'reports.multi': async () =>
    offenceDetails as unknown as Option<OffenceDetails>[],
  bonded: async (stash) =>
    stash !== 'alice-stash'
      ? constructOption()
      : constructOption('alice' as unknown as AccountId),
  'bonded.at': async (hash, stash) =>
    stash !== 'alice-stash'
      ? constructOption()
      : constructOption('alice' as unknown as AccountId),
  publicProps: async () =>
    [
      [1, 'hash1', 'charlie'],
      [2, 'hash2', 'dave'],
    ] as unknown as Vec<ITuple<[PropIndex, Hash, AccountId]>>,
  referendumInfoOf: async (idx) =>
    +idx === 1
      ? constructOption({
          end: 20,
          proposalHash: 'hash',
          threshold: 'Supermajorityapproval',
          delay: 10,
        } as unknown as ReferendumInfoTo239)
      : +idx === 2
      ? constructOption({
          isOngoing: true,
          isFinished: false,
          asOngoing: {
            end: 20,
            proposalHash: 'hash',
            threshold: 'Supermajorityapproval',
            delay: 10,
            tally: {
              ayes: 100,
              nays: 200,
              turnout: 300,
            },
          },
          asFinished: null,
        } as unknown as ReferendumInfo)
      : constructOption(),
  dispatchQueue: async () =>
    [
      { index: 1, imageHash: 'hash1', at: 20 },
      { index: 2, imageHash: 'hash2', at: 30 },
    ] as unknown as DeriveDispatch[],
  treasuryProposals: async (idx) =>
    +idx !== 1
      ? constructOption()
      : constructOption({
          proposer: 'alice',
          value: 1000,
          beneficiary: 'bob',
          bond: 2000,
        } as unknown as TreasuryProposal),
  bounties: async () =>
    [
      {
        bounty: {
          proposer: 'alice',
          value: 50,
          fee: 10,
          curatorDeposit: 10,
          bond: 10,
          status: {
            isActive: false,
            isPendingPayout: false,
            isProposed: true,
          },
        } as unknown as Bounty,
        description: 'hello',
        index: 0,
        proposals: [],
      },
      {
        bounty: {
          proposer: 'alice',
          value: 50,
          fee: 10,
          curatorDeposit: 10,
          bond: 10,
          status: {
            isActive: true,
            isPendingPayout: false,
            asActive: {
              curator: 'bob',
              updateDue: '999',
            },
          },
        } as unknown as Bounty,
        description: 'hello',
        index: 2,
        proposals: [],
      },
      {
        bounty: {
          proposer: 'alice',
          value: 50,
          fee: 10,
          curatorDeposit: 10,
          bond: 10,
          status: {
            isActive: false,
            isPendingPayout: true,
            asPendingPayout: {
              curator: 'bob',
              unlockAt: '9999',
              beneficiary: 'dave',
            },
          },
        } as unknown as Bounty,
        description: 'hello',
        index: 3,
        proposals: [],
      },
    ] as unknown as DeriveBounties,
  voting: async (hash) =>
    hash.toString() !== 'hash'
      ? constructOption()
      : constructOption({
          index: 1,
          threshold: 3,
          ayes: ['alice', 'bob'],
          nays: ['charlie', 'dave'],
          end: 100,
        } as unknown as Votes),
  signalingProposalOf: async (hash) =>
    hash.toString() !== 'hash'
      ? constructOption()
      : constructOption({
          index: 1,
          author: 'alice',
          stage: 'Voting',
          transition_time: 20,
          title: 'title',
          contents: 'contents',
          vote_id: 101,
        } as any),
  voteRecords: async (voteId) =>
    +voteId !== 101
      ? constructOption()
      : constructOption({
          data: {
            tally_type: 'onePerson',
            vote_type: 'binary',
          },
          outcomes: [1, 2],
        } as any),
  preimage: async (hash) =>
    hash.toString() !== 'hash'
      ? undefined
      : ({
          at: 30,
          balance: 1000,
          proposal: {
            section: 'section',
            method: 'method',
            args: ['arg1', 'arg2'],
          },
          proposer: 'alice',
        } as unknown as DeriveProposalImage),
  collectiveProposalOf: async (hash) =>
    hash.toString() !== 'hash'
      ? constructOption()
      : constructOption({
          section: 'section',
          method: 'method',
          args: ['arg1', 'arg2'],
        } as unknown as Proposal),
  identityOf: async (addr) =>
    constructOption({
      info: {
        // eslint-disable-next-line
        // @ts-ignore
        display: new Data(new TypeRegistry(), {
          Raw: stringToHex(`${addr}-display-name`),
        }),
      },
      judgements: [
        [0, constructIdentityJudgement(IdentityJudgement.KnownGood)],
        [1, constructIdentityJudgement(IdentityJudgement.Erroneous)],
      ],
    } as unknown as Registration),
  registrars: async () => [
    constructOption({ account: 'charlie' } as unknown as RegistrarInfo),
    constructOption({ account: 'dave' } as unknown as RegistrarInfo),
  ],
  tips: async () =>
    constructOption({
      reason: 'reasonHash',
      who: 'alice',
      finder: 'bob',
      deposit: '1000',
      closes: constructOption('123' as any),
      findersFee: {
        valueOf: () => true,
      },
    } as unknown as Option<OpenTip>),
  tipReasons: async () =>
    constructOption(stringToHex('hello world!') as unknown as Bytes),
});

class FakeEventData extends Array {
  public readonly typeDef: TypeDef[];

  constructor(typeDef: string[], ...values) {
    super(...values);
    this.typeDef = typeDef.map((type) => ({ type })) as TypeDef[];
  }
}

const constructEvent = (
  data: any[],
  section = '',
  typeDef: string[] = []
): Event => {
  return {
    data: new FakeEventData(typeDef, ...data),
    section,
  } as Event;
};

const constructExtrinsic = (signer: string, args: any[] = []): Extrinsic => {
  return {
    signer,
    args,
    data: new Uint8Array(),
  } as unknown as Extrinsic;
};

const constructBool = (b: boolean): bool => {
  return { isTrue: b === true, isFalse: b === false, isEmpty: false } as bool;
};

/* eslint-disable: dot-notation */
describe('Edgeware Event Enricher Filter Tests', () => {
  it('should enrich balance-transfer event to everyone without config', async () => {
    const kind = EventKind.BalanceTransfer;
    const event = constructEvent(['alice', 'bob', new BN('1001')], 'balances', [
      'AccountId',
      'AccountId',
      'Balance',
    ]);

    // publicly emit all transfers
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice', 'bob'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        sender: 'alice',
        dest: 'bob',
        value: '1001',
      },
    });
  });
  it('should enrich balance-transfer event with threshold 0 to everyone', async () => {
    const kind = EventKind.BalanceTransfer;
    const event = constructEvent(['alice', 'bob', new BN('10')], 'balances', [
      'AccountId',
      'AccountId',
      'Balance',
    ]);

    // publicly emit all transfers
    const result = await Enrich(api, blockNumber, kind, event, {
      balanceTransferThresholdPermill: 0,
    });
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice', 'bob'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        sender: 'alice',
        dest: 'bob',
        value: '10',
      },
    });
  });
  it('should enrich large balance-transfer event to everyone with config', async () => {
    const kind = EventKind.BalanceTransfer;
    const event = constructEvent(['alice', 'bob', new BN('1001')], 'balances', [
      'AccountId',
      'AccountId',
      'Balance',
    ]);

    // only publicly emit transfers > 1_000
    const result = await Enrich(api, blockNumber, kind, event, {
      balanceTransferThresholdPermill: 1_000,
    });
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice', 'bob'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        sender: 'alice',
        dest: 'bob',
        value: '1001',
      },
    });
  });
  it('should not enrich small balance-transfer event to anyone with config', async () => {
    const kind = EventKind.BalanceTransfer;
    const event = constructEvent(['alice', 'bob', new BN('999')], 'balances', [
      'AccountId',
      'AccountId',
      'Balance',
    ]);

    // only publicly emit transfers > 1_000
    const result = await Enrich(api, blockNumber, kind, event, {
      balanceTransferThresholdPermill: 1_000,
    });
    assert.deepEqual(result, null);
  });
  it('should enrich new-session event', async () => {
    // TODO
  });
  /** staking events */
  it('should enrich edgeware/old reward event', async () => {
    const kind = EventKind.Reward;
    const event = constructEvent([10000, 5], 'staking', ['Balance', 'Balance']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        amount: '10000',
      },
    });
  });
  it('should enrich new reward event', async () => {
    const kind = EventKind.Reward;
    const event = constructEvent(['Alice', 10000], 'staking', [
      'AccountId',
      'Balance',
    ]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: ['Alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        validator: 'Alice',
        amount: '10000',
      },
    });
  });
  it('should enrich slash event', async () => {
    const kind = EventKind.Slash;
    const event = constructEvent(['Alice', 10000]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: ['Alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        validator: 'Alice',
        amount: '10000',
      },
    });
  });
  it('should enrich bonded event', async () => {
    const kind = EventKind.Bonded;
    const event = constructEvent(['alice-stash', 10000]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: ['alice-stash'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        stash: 'alice-stash',
        amount: '10000',
        controller: 'alice',
      },
    });
  });
  it('should enrich unbonded event', async () => {
    const kind = EventKind.Unbonded;
    const event = constructEvent(['alice-stash', 10000]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: ['alice-stash'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        stash: 'alice-stash',
        amount: '10000',
        controller: 'alice',
      },
    });
  });
  it('should enrich staking-election event', async () => {
    const kind = EventKind.StakingElection;
    const event = constructEvent([]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        era: 5,
        validators: [
          'EXkCSUQ6Z1hKvGWMNkUDKrTMVHRduQHWc8G6vgo4NccUmhU',
          'FnWdLnFhRuphztWJJLoNV4zc18dBsjpaAMboPLhLdL7zZp3',
          'EZ7uBY7ZLohavWAugjTSUVVSABLfad77S6RQf4pDe3cV9q4',
          'GweeXog8vdnDhjiBCLVvbE4NA4CPTFS3pdFFAFwgZzpUzKu',
          'DbuPiksDXhFFEWgjsEghUypTJjQKyULiNESYji3Gaose2NV',
          'Gt6HqWBhdu4Sy1u8ASTbS1qf2Ac5gwdegwr8tWN8saMxPt5',
          'JKmFAAo9QbR9w3cfSYxk7zdpNEXaN1XbX4NcMU1okAdpwYx',
        ],
      },
    });
  });

  /** democracy events */
  it('should enrich vote-delegated event', async () => {
    const kind = EventKind.VoteDelegated;
    const event = constructEvent(['delegator', 'target']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: ['target'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        who: 'delegator',
        target: 'target',
      },
    });
  });
  it('should enrich democracy-proposed event', async () => {
    const kind = EventKind.DemocracyProposed;
    const event = constructEvent(['1', 1000]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['charlie'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalIndex: 1,
        proposalHash: 'hash1',
        deposit: '1000',
        proposer: 'charlie',
      },
    });
  });
  it('should enrich democracy-seconded event', async () => {
    const kind = EventKind.DemocracySeconded;
    const extrinsic = constructExtrinsic('alice', ['1']);
    const result = await Enrich(api, blockNumber, kind, extrinsic);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalIndex: 1,
        who: 'alice',
      },
    });
  });
  it('should enrich democracy-tabled event', async () => {
    const kind = EventKind.DemocracyTabled;
    const event = constructEvent(['1', 1000]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalIndex: 1,
      },
    });
  });
  it('should enrich old edgeware democracy-started event', async () => {
    const kind = EventKind.DemocracyStarted;
    const event = constructEvent(['1', 'Supermajorityapproval']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        referendumIndex: 1,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
        endBlock: 20,
      },
    });
  });
  it('should enrich new kusama democracy-started event', async () => {
    const kind = EventKind.DemocracyStarted;
    const event = constructEvent(['2', 'Supermajorityapproval']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        referendumIndex: 2,
        proposalHash: 'hash',
        voteThreshold: 'Supermajorityapproval',
        endBlock: 20,
      },
    });
  });
  it('should enrich new democracy-voted event', async () => {
    const kind = EventKind.DemocracyVoted;
    const extrinsic = constructExtrinsic('alice', [
      '1',
      constructAccountVote(true, 3, '100000'),
    ]);
    const result = await Enrich(api, blockNumber, kind, extrinsic);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        referendumIndex: 1,
        who: 'alice',
        balance: '100000',
        isAye: true,
        conviction: 3,
      },
    });
  });
  it('should not enrich democracy-voted event with split vote', (done) => {
    const kind = EventKind.DemocracyVoted;
    const extrinsic = constructExtrinsic('alice', [
      '1',
      constructAccountVote(true, 3, '100000', true),
    ]);
    Enrich(api, blockNumber, kind, extrinsic)
      .then(() => done(new Error('should not permit split vote')))
      .catch(() => done());
  });
  it('should enrich democracy-passed event', async () => {
    const kind = EventKind.DemocracyPassed;
    const event = constructEvent(['1']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        referendumIndex: 1,
        dispatchBlock: 20,
      },
    });
  });
  it('should enrich democracy-not-passed event', async () => {
    const kind = EventKind.DemocracyNotPassed;
    const event = constructEvent(['1']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        referendumIndex: 1,
      },
    });
  });
  it('should enrich democracy-cancelled event', async () => {
    const kind = EventKind.DemocracyCancelled;
    const event = constructEvent(['1']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        referendumIndex: 1,
      },
    });
  });
  it('should enrich democracy-executed event', async () => {
    const kind = EventKind.DemocracyExecuted;
    const event = constructEvent(['1', constructBool(false)]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        referendumIndex: 1,
        executionOk: false,
      },
    });
  });

  /** preimage events */
  it('should enrich preimage-noted event', async () => {
    const kind = EventKind.PreimageNoted;
    const event = constructEvent(['hash', 'alice', 100]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'hash',
        noter: 'alice',
        preimage: {
          method: 'method',
          section: 'section',
          args: ['arg1', 'arg2'],
        },
      },
    });
  });
  it('should enrich preimage-used event', async () => {
    const kind = EventKind.PreimageUsed;
    const event = constructEvent(['hash', 'alice', 100]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'hash',
        noter: 'alice',
      },
    });
  });
  it('should enrich preimage-invalid event', async () => {
    const kind = EventKind.PreimageInvalid;
    const event = constructEvent(['hash', '1']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'hash',
        referendumIndex: 1,
      },
    });
  });
  it('should enrich preimage-missing event', async () => {
    const kind = EventKind.PreimageMissing;
    const event = constructEvent(['hash', '1']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'hash',
        referendumIndex: 1,
      },
    });
  });
  it('should enrich preimage-reaped event', async () => {
    const kind = EventKind.PreimageReaped;
    const event = constructEvent(['hash', 'alice', 100, 'bob']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['bob'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'hash',
        noter: 'alice',
        reaper: 'bob',
      },
    });
  });

  /** tip events */
  it('should enrich new-tip event', async () => {
    const kind = EventKind.NewTip;
    const event = constructEvent(['tip-hash']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'tip-hash',
        reason: 'hello world!',
        who: 'alice',
        finder: 'bob',
        deposit: '1000',
        findersFee: true,
      },
    });
  });
  it('should enrich tip-voted event', async () => {
    const kind = EventKind.TipVoted;
    const extrinsic = constructExtrinsic('bob', ['tip-hash', '100']);
    const result = await Enrich(api, blockNumber, kind, extrinsic);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'tip-hash',
        who: 'bob',
        value: '100',
      },
    });
  });
  it('should enrich tip-closing event', async () => {
    const kind = EventKind.TipClosing;
    const event = constructEvent(['tip-hash']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'tip-hash',
        closing: 123,
      },
    });
  });
  it('should enrich tip-closed event', async () => {
    const kind = EventKind.TipClosed;
    const event = constructEvent(['tip-hash', 'charlie', '123']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'tip-hash',
        who: 'charlie',
        payout: '123',
      },
    });
  });
  it('should enrich tip-retracted event', async () => {
    const kind = EventKind.TipRetracted;
    const event = constructEvent(['tip-hash']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'tip-hash',
      },
    });
  });
  it('should enrich tip-slashed event', async () => {
    const kind = EventKind.TipSlashed;
    const event = constructEvent(['tip-hash', 'dave', '111']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalHash: 'tip-hash',
        finder: 'dave',
        deposit: '111',
      },
    });
  });

  /** treasury events */
  it('should enrich treasury-proposed event', async () => {
    const kind = EventKind.TreasuryProposed;
    const event = constructEvent(['1']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalIndex: 1,
        proposer: 'alice',
        value: '1000',
        beneficiary: 'bob',
        bond: '2000',
      },
    });
  });
  it('should enrich treasury-awarded event', async () => {
    const kind = EventKind.TreasuryAwarded;
    const event = constructEvent(['1', 1000, 'bob']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalIndex: 1,
        value: '1000',
        beneficiary: 'bob',
      },
    });
  });
  it('should enrich treasury-rejected event', async () => {
    const kind = EventKind.TreasuryRejected;
    const event = constructEvent(['1', 100]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        proposalIndex: 1,
      },
    });
  });

  /** elections events */
  it('should enrich election-new-term event', async () => {
    const kind = EventKind.ElectionNewTerm;
    const event = constructEvent([
      [
        ['alice', 10],
        ['bob', 20],
      ],
    ]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        round: 10,
        newMembers: ['alice', 'bob'],
        allMembers: ['dave', 'charlie', 'eve'],
      },
    });
  });
  it('should enrich election-empty-term event', async () => {
    const kind = EventKind.ElectionEmptyTerm;
    const event = constructEvent([]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        round: 10,
        members: ['dave', 'charlie', 'eve'],
      },
    });
  });
  it('should enrich election-candidacy-submitted event', async () => {
    const kind = EventKind.ElectionCandidacySubmitted;
    const extrinsic = constructExtrinsic('alice');
    const result = await Enrich(api, blockNumber, kind, extrinsic);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        round: 10,
        candidate: 'alice',
      },
    });
  });
  it('should enrich election-member-kicked event', async () => {
    const kind = EventKind.ElectionMemberKicked;
    const event = constructEvent(['alice']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        who: 'alice',
      },
    });
  });
  it('should enrich election-member-renounced event', async () => {
    const kind = EventKind.ElectionMemberRenounced;
    const event = constructEvent(['alice']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        who: 'alice',
      },
    });
  });

  /** TreasuryReward events */
  it('should enrich treasury-reward-minted-v1 event', async () => {
    const kind = EventKind.TreasuryRewardMinting;
    const event = constructEvent([1000, 100, 10]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        pot: '1000',
        reward: '100',
      },
    });
  });
  it('should enrich treasury-reward-minted-v2 event', async () => {
    const kind = EventKind.TreasuryRewardMintingV2;
    const event = constructEvent([1000, 10, 'pot']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        pot: '1000',
        potAddress: 'pot',
      },
    });
  });

  /** Identity events */
  it('should enrich identity-set event', async () => {
    const kind = EventKind.IdentitySet;
    const event = constructEvent(['alice']);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        who: 'alice',
        displayName: 'alice-display-name',
        judgements: [
          ['charlie', IdentityJudgement.KnownGood],
          ['dave', IdentityJudgement.Erroneous],
        ],
      },
    });
  });
  it('should enrich identity-cleared event', async () => {
    const kind = EventKind.IdentityCleared;
    const event = constructEvent(['alice', 1000]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['alice'],
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        who: 'alice',
      },
    });
  });
  it('should enrich identity-killed event', async () => {
    const kind = EventKind.IdentityKilled;
    const event = constructEvent(['alice', 1000]);
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        who: 'alice',
      },
    });
  });
  /** offences events */
  it('should enrich new offence event', async () => {
    const kind = EventKind.Offence;
    const event = constructEvent(
      ['offline', '10000', constructBool(true), offenceDetails],
      'offences',
      ['Kind', 'OpaqueTimeSlot', 'bool', 'Option<OffenceDetails>[]']
    );
    const result = await Enrich(api, blockNumber, kind, event);

    assert.deepEqual(result, {
      blockNumber,
      network: SupportedNetwork.Substrate,
      data: {
        kind,
        offenceKind: 'offline',
        opaqueTimeSlot: '10000',
        applied: constructBool(true).isTrue,
        offenders: ['charlie'],
      },
    });
  });
  /** other */
  it('should not enrich invalid event', (done) => {
    const kind = 'invalid-event' as EventKind;
    const event = constructEvent([]);
    Enrich(api, blockNumber, kind, event)
      .then(() => done(new Error('should not permit invalid event')))
      .catch(() => done());
  });
  it('should not enrich with invalid API query', (done) => {
    const kind = EventKind.Bonded;
    const event = constructEvent(['alice-not-stash', 10000]);
    Enrich(api, blockNumber, kind, event)
      .then(() => done(new Error('should not permit invalid API result')))
      .catch(() => done());
  });
});
