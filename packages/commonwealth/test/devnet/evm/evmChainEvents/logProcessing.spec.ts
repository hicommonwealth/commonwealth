import { Log } from '@ethersproject/providers';
import { dispose } from '@hicommonwealth/core';
import { getAnvil } from '@hicommonwealth/evm-testing';
import { tester } from '@hicommonwealth/model';
import { AbiType } from '@hicommonwealth/shared';
import { Anvil } from '@viem/anvil';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getTestAbi } from 'test/integration/evmChainEvents/util';
import { afterAll, beforeAll, describe, test } from 'vitest';
import {
  getEvents,
  getLogs,
  getProvider,
  parseLogs,
} from '../../../../server/workers/evmChainEvents/logProcessing';
import {
  ContractSources,
  EvmEvent,
  EvmSource,
} from '../../../../server/workers/evmChainEvents/types';
import {
  compoundPropCreatedSignature,
  compoundPropQueuedSignature,
  localRpc,
  sdk,
} from './util';

chai.use(chaiAsPromised);

const compoundVotingDelayBlocks = 13140;
const compoundVotingPeriodBlocks = 19710;

/*
 * The main objective of these tests is to ensure log processing logic works
 * as expected irrespective of the underlying event type.
 */
describe('EVM Chain Events Log Processing Tests', () => {
  let propCreatedResult: { block: number; proposalId: string },
    propQueuedResult: { block: number },
    abi: AbiType,
    propCreatedLog: Log,
    propQueuedLog: Log,
    anvil: Anvil;

  beforeAll(async function () {
    anvil = await getAnvil();
    await tester.seedDb();
    abi = (await getTestAbi()).abi;

    await sdk.getVotingPower(1, '400000');
    propCreatedResult = await sdk.createProposal(1);
    await sdk.mineBlocks(compoundVotingDelayBlocks + 1);
    expect(propCreatedResult.block).to.not.be.undefined;
  }, 80_000);

  afterAll(async () => {
    await anvil.stop();
    await dispose()();
  });

  const expectAbi = () => expect(abi, 'ABI must be defined to run this test');

  describe('fetching logs', () => {
    test('should not return any logs if no contract addresses are given', async () => {
      const provider = getProvider(localRpc);
      const currentBlockNum = await provider.getBlockNumber();
      const { logs } = await getLogs({
        rpc: localRpc,
        maxBlockRange: 500,
        contractAddresses: [],
        startingBlockNum: currentBlockNum,
      });
      expect(logs).to.be.empty;
    });

    test('should throw if the provider cannot be connected to', async () => {
      await expect(
        getLogs({
          rpc: 'http://fake',
          maxBlockRange: 500,
          contractAddresses: ['0x1'],
          startingBlockNum: 1,
        }),
      )
        .to.eventually.be.rejected.and.be.an.instanceof(Error)
        .and.have.property(
          'message',
          'could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)',
        );
    });

    test('should not throw if the starting block number is greater than the current block number', async () => {
      const provider = getProvider(localRpc);
      const currentBlockNum = await provider.getBlockNumber();
      await expect(
        getLogs({
          rpc: localRpc,
          maxBlockRange: 500,
          contractAddresses: ['0x1'],
          startingBlockNum: currentBlockNum + 1000,
        }),
      ).to.not.be.rejected;
    });

    test(
      'should fetch logs from the specified range',
      { timeout: 360_000 },
      async () => {
        expectAbi();
        expect(
          propCreatedResult,
          'Must have created a proposal to run this test',
        ).to.not.be.undefined;

        await sdk.castVote(propCreatedResult.proposalId, 1, true);
        await sdk.mineBlocks(compoundVotingPeriodBlocks + 1);

        propQueuedResult = await sdk.queueProposal(
          propCreatedResult.proposalId,
        );

        const propCreatedLogs = await getLogs({
          rpc: localRpc,
          maxBlockRange: 500,
          contractAddresses: [sdk.contractAddrs.compound.governance],
          startingBlockNum: propCreatedResult.block,
          endingBlockNum: propCreatedResult.block + 1,
        });
        expect(propCreatedLogs.logs.length).to.equal(1);
        propCreatedLog = propCreatedLogs.logs[0];

        const propQueuedLogs = await getLogs({
          rpc: localRpc,
          maxBlockRange: 500,
          contractAddresses: [sdk.contractAddrs.compound.governance],
          startingBlockNum: propQueuedResult.block,
          endingBlockNum: propQueuedResult.block + 1,
        });
        expect(propQueuedLogs.logs.length).to.equal(1);
        propQueuedLog = propQueuedLogs.logs[0];
      },
    );

    test(
      'should restrict the maximum block range fetched',
      { timeout: 80_000 },
      async () => {
        expectAbi();

        expect(propQueuedResult.block).to.not.be.undefined;
        await sdk.mineBlocks(502);

        const { logs } = await getLogs({
          rpc: localRpc,
          maxBlockRange: 500,
          contractAddresses: [sdk.contractAddrs.compound.governance],
          startingBlockNum: propQueuedResult.block - 1,
        });
        expect(logs).to.be.empty;
      },
    );
  });

  describe('parsing logs', () => {
    beforeAll(() => {
      expect(
        propCreatedLog,
        'Must have fetched the proposal created log to run this test',
      ).to.not.be.undefined;
      expect(
        propQueuedLog,
        'Must have fetched the proposal queued log to run this test',
      ).to.not.be.undefined;
    });

    test('should not throw if an invalid ABI is given for a contract address', async () => {
      let evmSource: EvmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            sources: [
              {
                event_signature: compoundPropCreatedSignature,
                kind: 'proposal-created',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
              },
            ],
          },
        } as ContractSources,
      };

      let result = await parseLogs(evmSource.contracts, [propCreatedLog]);
      expect(result.length).to.equal(0);

      evmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            abi: 'invalid abi' as unknown as AbiType,
            sources: [
              {
                event_signature: compoundPropCreatedSignature,
                kind: 'proposal-created',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
              },
            ],
          },
        },
      };

      result = await parseLogs(evmSource.contracts, [propCreatedLog]);
      expect(result.length).to.equal(0);

      evmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            abi: [],
            sources: [
              {
                event_signature: compoundPropCreatedSignature,
                kind: 'proposal-created',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
              },
            ],
          },
        },
      };

      result = await parseLogs(evmSource.contracts, [propCreatedLog]);
      expect(result.length).to.equal(0);
    });

    test.skip('should not throw if a log cannot be parsed', async () => {
      expectAbi();

      const evmSource: EvmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            abi,
            sources: [
              {
                event_signature: compoundPropCreatedSignature,
                kind: 'proposal-created',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
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

        address: sdk.contractAddrs.compound.governance.toLowerCase(),
        data: '0x1',
        topics: [compoundPropCreatedSignature],
        transactionHash: '0x1',
        logIndex: 1,
      };

      let events: EvmEvent[];
      try {
        events = await parseLogs(evmSource.contracts, [
          fakeLog,
          propCreatedLog,
        ]);
      } catch (e) {
        expect.fail('Failing to parse a log should not throw an error');
      }

      expect(events.length).to.equal(1);
      expect(events[0].rawLog.address).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(events[0].eventSource.kind).to.equal('proposal-created');
      expect(events[0].rawLog.blockNumber).to.equal(propCreatedLog.blockNumber);
      expect(events[0].parsedArgs).to.exist;
    });

    test('should only parse logs with a matching signature', async () => {
      expectAbi();

      const evmSource: EvmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [sdk.contractAddrs.compound.governance.toLowerCase()]: {
            abi,
            sources: [
              {
                event_signature: compoundPropQueuedSignature,
                kind: 'proposal-queued',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
              },
            ],
          },
        },
      };

      const events = await parseLogs(evmSource.contracts, [
        propCreatedLog,
        propQueuedLog,
      ]);
      expect(events.length).to.equal(1);
      expect(events[0].rawLog.address).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(events[0].eventSource.kind).to.equal('proposal-queued');
      expect(events[0].rawLog.blockNumber).to.equal(propQueuedLog.blockNumber);
      expect(events[0].parsedArgs).to.exist;
    });
  });

  // since all error handling tests are performed above there is no need to repeat these
  // tests here - as such this is a simple test to ensure normal functionality
  describe('getEvents', () => {
    beforeAll(() => {
      expectAbi();
      expect(
        propCreatedResult,
        'Must have created a proposal to run these test',
      ).to.not.be.undefined;
      expect(propQueuedResult, 'Must have queued a proposal to run these test')
        .to.not.be.undefined;
    });

    test('should return all fetched and parsed logs', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            abi,
            sources: [
              {
                event_signature: compoundPropQueuedSignature,
                kind: 'proposal-queued',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
              },
              {
                event_signature: compoundPropCreatedSignature,
                kind: 'proposal-created',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
              },
            ],
          },
        },
      };

      const createdEvent = await getEvents(
        evmSource,
        propCreatedResult.block - 1,
        propCreatedResult.block + 5,
      );
      expect(createdEvent.events.length).to.equal(1);

      const queuedEvent = await getEvents(
        evmSource,
        propQueuedResult.block - 1,
        propQueuedResult.block + 5,
      );
      expect(queuedEvent.events.length).to.equal(1);

      const events = createdEvent.events.concat(queuedEvent.events);

      const propCreatedEvent = events.find(
        (e) => e.eventSource.kind === 'proposal-created',
      );
      expect(propCreatedEvent).to.exist;
      expect(propCreatedEvent!.rawLog.address).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      // @ts-expect-error StrictNullChecks
      expect(propCreatedEvent.eventSource.kind).to.equal('proposal-created');
      // @ts-expect-error StrictNullChecks
      expect(propCreatedEvent.rawLog.blockNumber).to.equal(
        propCreatedLog.blockNumber,
      );
      // @ts-expect-error StrictNullChecks
      expect(propCreatedEvent.parsedArgs).to.exist;

      const propQueuedEvent = events.find(
        (e) => e.eventSource.kind === 'proposal-queued',
      );
      expect(propQueuedEvent).to.exist;
      expect(propQueuedEvent!.rawLog.address).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(propQueuedEvent!.eventSource.kind).to.equal('proposal-queued');
      expect(propQueuedEvent!.rawLog.blockNumber).to.equal(
        propQueuedLog.blockNumber,
      );
      // @ts-expect-error StrictNullChecks
      expect(propQueuedEvent.parsedArgs).to.exist;
    });
  });
});
