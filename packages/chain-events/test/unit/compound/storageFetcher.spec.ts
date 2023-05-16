import chai from 'chai';
import { BigNumber, utils } from 'ethers';

import { SupportedNetwork } from '../../../src';
import { StorageFetcher } from 'chain-events/src/chain-bases/EVM/compound/storageFetcher';
import type { RawEvent } from 'chain-events/src/chain-bases/EVM/compound/types';
import {
  EventKind,
  ProposalState,
} from 'chain-events/src/chain-bases/EVM/compound/types';
import type { GovernorAlpha } from '../../../src/contractTypes';

const { assert } = chai;

const constructEvent = (blockNumber: number, data, rawData?): RawEvent => {
  return {
    args: data,
    data: rawData,
    blockNumber,
  } as RawEvent;
};

const makeApi = (proposals, isBravo = false) => {
  const governorAlpha = {
    interface: {
      functions: {
        'guardian()': !isBravo,
      },
    },
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
    queryFilter: async (filter) => {
      // TODO: support all filters
      if (filter === 'ProposalCreated') {
        const events = proposals.map((p) => {
          const rawData = utils.defaultAbiCoder.encode(
            [
              'uint',
              'address',
              'address[]',
              'uint[]',
              'string[]',
              'bytes[]',
              'uint',
              'uint',
              'bytes',
            ],
            p
          );
          return constructEvent(
            +p[6],
            {
              id: p[0],
              proposer: p[1],
              targets: p[2],
              3: p[3],
              signatures: p[4],
              calldatas: p[5],
              startBlock: p[6],
              endBlock: p[7],
              description: p[8],
            },
            rawData
          );
        });
        return events;
      }
      return [];
    },
    filters: {
      VoteCast: () => 'VoteCast',
      ProposalCreated: () => 'ProposalCreated',
      ProposalCanceled: () => 'ProposalCanceled',
      ProposalQueued: () => 'ProposalQueued',
      ProposalExecuted: () => 'ProposalExecuted',
    },
  } as unknown as GovernorAlpha;
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
    const address = '0x6E0d01A76C3Cf4288372a29124A26D4353EE51BE';
    const callData = utils.toUtf8Bytes('calldata');
    const proposals = [
      [
        BigNumber.from(1),
        address,
        [address],
        [BigNumber.from(3)],
        ['hello3'],
        [callData],
        BigNumber.from(200),
        BigNumber.from(3 * 172),
        utils.toUtf8Bytes('test description'),
      ],
    ];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [
      {
        blockNumber: 200,
        excludeAddresses: [address],
        network: SupportedNetwork.Compound,
        data: {
          id: '0x01',
          kind: EventKind.ProposalCreated,
          proposer: address,
          targets: [address],
          values: ['3'],
          signatures: ['hello3'],
          calldatas: [utils.hexlify(callData)],
          startBlock: 200,
          endBlock: 3 * 172, // votingPeriod()
          description: 'test description',
        },
      },
    ]);
  });
});
