import chai from 'chai';
import { BigNumber } from 'ethers';

import { StorageFetcher } from '../../../src/aave/storageFetcher';
import { EventKind, Proposal, ProposalState } from '../../../src/aave/types';
import { AaveGovernanceV2 } from '../../../src/contractTypes';

const { assert } = chai;

const makeApi = (proposals: Proposal[]) => {
  const governance = ({
    provider: {
      getBlockNumber: async () => 200,
      getBlock: async () => ({ number: 200 }),
    },
    getProposalsCount: async () => proposals.length,
    getProposalById: async (n: number) => proposals[n],
    getProposalState: async () => ProposalState.CANCELED,
    filters: {
      VoteEmitted: () => null,
    },
    // TODO: test vote queries
    queryFilter: async () => [],
  } as unknown) as AaveGovernanceV2;
  return { governance };
};

describe('Aave Storage Fetcher Tests', () => {
  it('should run gracefully with nothing in storage', async () => {
    const api = makeApi([]);
    const fetcher = new StorageFetcher(api);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });
  it('should handle a creation event from the contract', async () => {
    const p = {
      id: BigNumber.from(1),
      creator: 'creator',
      executor: 'executor',
      targets: ['target'],
      values: undefined,
      signatures: ['signature'],
      calldatas: ['calldata'],
      withDelegatecalls: [true],
      startBlock: BigNumber.from(5),
      endBlock: BigNumber.from(100),
      executionTime: BigNumber.from(0),
      forVotes: BigNumber.from(1000),
      againstVotes: BigNumber.from(2000),
      canceled: true,
      executed: false,
      strategy: 'strategy',
      ipfsHash: 'hash',
    };
    const proposals: Proposal[] = [
      {
        0: p.id,
        1: p.creator,
        2: p.executor,
        3: p.targets,
        4: [BigNumber.from(10)],
        5: p.signatures,
        6: p.calldatas,
        7: p.withDelegatecalls,
        8: p.startBlock,
        9: p.endBlock,
        10: p.executionTime,
        11: p.forVotes,
        12: p.againstVotes,
        13: p.executed,
        14: p.canceled,
        15: p.strategy,
        16: p.ipfsHash,
        ...p,
      } as Proposal,
    ];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api);
    const fetched = await fetcher.fetch(undefined, true);
    assert.sameDeepMembers(fetched, [
      {
        blockNumber: 5,
        data: {
          kind: EventKind.ProposalCreated,
          id: 1,
          proposer: 'creator',
          executor: 'executor',
          startBlock: 5,
          endBlock: 100,
          signatures: ['signature'],
          calldatas: ['calldata'],
          values: ['10'],
          targets: ['target'],
          strategy: 'strategy',
          ipfsHash: 'hash',
        },
      },
      {
        blockNumber: 100,
        data: {
          kind: EventKind.ProposalCanceled,
          id: 1,
        },
      },
    ]);
  });
});
