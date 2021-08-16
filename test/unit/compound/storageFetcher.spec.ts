import chai from 'chai';
import { BigNumber } from 'ethers';

import { StorageFetcher } from '../../../src/compound/storageFetcher';
import {
  EventKind,
  Proposal,
  ProposalState,
} from '../../../src/compound/types';
import { GovernorAlpha } from '../../../src/contractTypes';

const { assert } = chai;

const makeApi = (proposals: Proposal[]) => {
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
      return ProposalState.Active;
    },
    queryFilter: async () => [],
    filters: {
      VoteCast: async () => null,
    },
  } as unknown) as GovernorAlpha;
  return governorAlpha;
};

describe('Compound Storage Fetcher Tests', () => {
  it('should run gracefully with nothing in storage', async () => {
    const api = makeApi([]);
    const fetcher = new StorageFetcher(api);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });
  it('should handle a creation event from the contract', async () => {
    const proposals: Proposal[] = [
      ({
        id: BigNumber.from(1),
        proposer: '',
        eta: BigNumber.from(0),
        startBlock: BigNumber.from(200),
        endBlock: BigNumber.from(3 * 172),
        forVotes: BigNumber.from(0),
        againstVotes: BigNumber.from(0),
        canceled: false,
        executed: false,
      } as unknown) as Proposal,
    ];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api);
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
        },
      },
    ]);
  });
});
