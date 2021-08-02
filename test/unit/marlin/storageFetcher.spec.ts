import chai from 'chai';
import { BigNumber } from 'ethers';

import { StorageFetcher } from '../../../src/marlin/storageFetcher';
import { EventKind, Proposal } from '../../../src/marlin/types';
import { MPond, GovernorAlpha, Timelock } from '../../../src/contractTypes';

const { assert } = chai;

const makeApi = (proposals: Proposal[]) => {
  const comp = ({
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    },
  } as unknown) as MPond;
  const governorAlpha = ({
    votingDelay: async () => '2',
    votingPeriod: async () => '2',
    proposalCount: async () => proposals.length,
    proposals: async (n: number) => proposals[n - 1],
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    },
    state: async () => {
      return 1;
    },
  } as unknown) as GovernorAlpha;
  const timelock = ({
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    },
  } as unknown) as Timelock;
  return {
    comp,
    governorAlpha,
    timelock,
  };
};

const makeDater = (minAvailableBlock = 0) => {
  return {
    getDate: (timestamp) => {
      if (!timestamp) throw new Error('no timestamp given');
      if (timestamp / 1000 < minAvailableBlock) return undefined;
      return {
        date: `${timestamp / 1000}`,
        block: timestamp / 1000,
      };
    },
  };
};

describe('Marlin Storage Fetcher Tests', () => {
  it('should run gracefully with nothing in storage', async () => {
    const api = makeApi([]);
    const fetcher = new StorageFetcher(api, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });
  it('should handle a creation event from the contract', async () => {
    const proposals: Proposal[] = [
      ({
        id: BigNumber.from(1),
        proposer: '',
        eta: BigNumber.from(3),
        startBlock: BigNumber.from(200),
        endBlock: BigNumber.from(3 * 172),
        forVotes: BigNumber.from(0),
        againstVotes: BigNumber.from(0),
        canceled: false,
        executed: false,
        description: '',
      } as unknown) as Proposal,
    ];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [
      {
        blockNumber: 200,
        data: {
          id: 1,
          kind: EventKind.ProposalCreated,
          proposer: '',
          startBlock: 200,
          endBlock: 3 * 172,
          signatures: [],
          calldatas: [],
          values: [],
          targets: [],
          description: '',
        },
      },
    ]);
  });
});
