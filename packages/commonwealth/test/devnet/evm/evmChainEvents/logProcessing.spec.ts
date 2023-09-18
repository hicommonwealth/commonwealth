import { expect } from 'chai';
import {
  getLogs,
  getProvider,
  parseLogs,
} from '../../../../server/workers/evmChainEvents/logProcessing';
import {
  EvmSource,
  RawEvmEvent,
} from '../../../../server/workers/evmChainEvents/types';
import {
  aavePropCreatedSignature,
  aavePropQueuedSignature,
  localRpc,
  sdk,
} from './util';
import models from '../../../../server/database';
import { getEvmSecondsAndBlocks } from 'chain-events/test/util';
import { AbiType } from '../../../../shared/types';
import { Log } from '@ethersproject/providers';

/*
 * The main objective of these tests is to ensure log processing logic works
 * as expected irrespective of the underlying event type.
 */
describe('EVM Chain Events Log Processing Tests', () => {
  let propResult: { block: number; proposalId: string },
    abi: AbiType,
    propCreatedLog,
    propQueuedLog;

  before(async () => {
    const abiRes = await models.ContractAbi.findOne({
      where: {
        nickname: 'AaveGovernanceV2',
      },
    });

    abi = abiRes.abi;
  });

  describe('fetching logs', () => {
    it('should not throw if a starting block number is not provided', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          '0x1': {
            abi: [],
            sources: [],
          },
        },
      };
      await expect(getLogs(evmSource, null)).to.not.be.rejected;
    });

    it('should not return any logs if no contract addresses are given', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {},
      };
      const { logs } = await getLogs(evmSource);
      expect(logs).to.be.empty;
    });

    it('should throw if the provider cannot be connected to', async () => {
      const evmSource: EvmSource = {
        rpc: 'http://fake',
        contracts: {},
      };
      await expect(getLogs(evmSource)).to.be.rejectedWith(
        'Failed to connect to provider'
      );
    });

    it('should throw if the starting block number is greater than the current block number', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          '0x1': {
            abi: [],
            sources: [],
          },
        },
      };

      const provider = getProvider(evmSource.rpc);
      const currentBlockNum = await provider.getBlockNumber();
      await expect(getLogs(evmSource, currentBlockNum + 1000)).to.not.be
        .rejected;
    });

    it('should restrict the maximum block range fetched to 500 blocks', async () => {
      await sdk.getVotingPower(1, '400000', 'aave');
      propResult = await sdk.createProposal(1, 'aave');
      await sdk.safeAdvanceTime(propResult.block + 501);

      // fetch logs
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.aave.governance]: {
            abi,
            sources: [
              {
                event_signature: aavePropCreatedSignature,
                kind: 'proposal-created',
              },
            ],
          },
        },
      };

      const { logs } = await getLogs(evmSource, propResult.block);
      expect(logs).to.be.empty;
    });

    it('should fetch logs with current block - maxOldBlocks if no starting block number is provided', async () => {
      expect(propResult).to.not.be.undefined;
      // fetch logs
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.aave.governance]: {
            abi,
            sources: [
              {
                event_signature: aavePropCreatedSignature,
                kind: 'proposal-created',
              },
            ],
          },
        },
      };

      const currentBlockNum = (await sdk.getBlock()).number;
      const { logs } = await getLogs(
        evmSource,
        null,
        currentBlockNum - propResult.block + 5
      );
      expect(logs.length).to.equal(1);
      propCreatedLog = logs[0];
    });

    it('should fetch logs from the starting block number if provided', async () => {
      expect(propResult).to.not.be.undefined;

      let res = getEvmSecondsAndBlocks(3);
      await sdk.safeAdvanceTime(propResult.block + res.blocks);
      await sdk.castVote(propResult.proposalId, 1, true, 'aave');
      res = getEvmSecondsAndBlocks(3);
      await sdk.advanceTime(String(res.secs), res.blocks);

      const { block } = await sdk.queueProposal(propResult.proposalId, 'aave');

      // fetch logs
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.aave.governance]: {
            abi,
            sources: [
              {
                event_signature: aavePropQueuedSignature,
                kind: 'proposal-queued',
              },
            ],
          },
        },
      };

      const { logs } = await getLogs(evmSource, block);
      expect(logs.length).to.equal(1);
      propQueuedLog = logs[0];
    });

    // TODO: do we want to fetch only up to currentBlock - 7 blocks to account for micro-reorgs?
    xit('should not fetch the most recent block', async () => {});
  });

  describe('parsing logs', () => {
    before(() => {
      expect(propCreatedLog).to.not.be.undefined;
      expect(propQueuedLog).to.not.be.undefined;
    });

    it('should throw if an abi is not provided for a contract address', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.aave.governance]: {
            abi: [],
            sources: [
              {
                event_signature: aavePropCreatedSignature,
                kind: 'proposal-created',
              },
            ],
          },
        },
      };

      await expect(parseLogs(evmSource.contracts, [propCreatedLog])).to.be
        .rejected;
    });

    it('should not throw if a log cannot be parsed', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.aave.governance]: {
            abi,
            sources: [
              {
                event_signature: aavePropCreatedSignature,
                kind: 'proposal-created',
              },
            ],
          },
        },
      };

      const fakeLog: Log = {
        blockNumber: 1,
        blockHash: '0x1',
        transactionIndex: 1,

        removed: false,

        address: sdk.contractAddrs.aave.governance.toLowerCase(),
        data: '0x1',
        topics: [aavePropCreatedSignature],
        transactionHash: '0x1',
        logIndex: 1,
      };

      let events: RawEvmEvent[];
      try {
        events = await parseLogs(evmSource.contracts, [
          fakeLog,
          propCreatedLog,
        ]);
      } catch (e) {
        expect.fail('Failing to parse a log should not throw an error');
      }

      expect(events.length).to.equal(1);
      expect(events[0].contractAddress).to.equal(
        sdk.contractAddrs.aave.governance
      );
      expect(events[0].kind).to.equal('proposal-created');
      expect(events[0].blockNumber).to.equal(propCreatedLog.blockNumber);
      expect(events[0].args).to.exist;
    });

    it('should only parse logs with a matching signature', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.aave.governance]: {
            abi,
            sources: [
              {
                event_signature: aavePropCreatedSignature,
                kind: 'proposal-created',
              },
              {
                event_signature: aavePropQueuedSignature,
                kind: 'proposal-queued',
              },
            ],
          },
        },
      };
    });
  });
  describe('getEvents', () => {});
});
