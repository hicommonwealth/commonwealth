import { Log } from '@ethersproject/providers';
import { AbiType, dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getTestAbi } from 'test/integration/evmChainEvents/util';
import Web3 from 'web3';
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
  getEvmSecondsAndBlocks,
  localRpc,
  sdk,
} from './util';

chai.use(chaiAsPromised);

const web3 = new Web3();

/*
 * The main objective of these tests is to ensure log processing logic works
 * as expected irrespective of the underlying event type. Most of the tests
 * are interdependent therefore mocha should exit on the first failure.
 */
describe('EVM Chain Events Log Processing Tests', () => {
  let propCreatedResult: { block: number; proposalId: string },
    propQueuedResult: { block: number },
    abi: AbiType,
    propCreatedLog: Log,
    propQueuedLog: Log;

  before(async () => {
    await tester.seedDb();
    abi = (await getTestAbi()).abi;
  });

  after(async () => {
    await dispose()();
  });

  const expectAbi = () => expect(abi, 'ABI must be defined to run this test');

  describe('fetching logs', () => {
    it('should not throw if a starting block number is not provided', async () => {
      await expect(
        getLogs({
          rpc: localRpc,
          contractAddresses: ['0x1'],
        }),
      ).to.not.be.rejected;
    });

    it('should not return any logs if no contract addresses are given', async () => {
      const { logs } = await getLogs({
        rpc: localRpc,
        contractAddresses: [],
      });
      expect(logs).to.be.empty;
    });

    it('should throw if the provider cannot be connected to', async () => {
      await expect(
        getLogs({
          rpc: 'http://fake',
          contractAddresses: [],
        }),
      )
        .to.eventually.be.rejected.and.be.an.instanceof(Error)
        .and.have.property(
          'message',
          'could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)',
        );
    });

    it('should throw if the starting block number is greater than the current block number', async () => {
      const provider = getProvider(localRpc);
      const currentBlockNum = await provider.getBlockNumber();
      await expect(
        getLogs({
          rpc: localRpc,
          contractAddresses: ['0x1'],
          startingBlockNum: currentBlockNum + 1000,
        }),
      ).to.not.be.rejected;
    });

    it('should restrict the maximum block range fetched to 500 blocks', async () => {
      expectAbi();

      await sdk.getVotingPower(1, '400000');
      propCreatedResult = await sdk.createProposal(1);
      await sdk.safeAdvanceTime(propCreatedResult.block + 501);

      expect(propCreatedResult.block).to.not.be.undefined;
      const { logs } = await getLogs({
        rpc: localRpc,
        contractAddresses: [sdk.contractAddrs.compound.governance],
        startingBlockNum: propCreatedResult.block,
      });
      expect(logs).to.be.empty;
    }).timeout(80_000);

    it('should fetch logs from the specified range', async () => {
      expectAbi();
      expect(propCreatedResult, 'Must have created a proposal to run this test')
        .to.not.be.undefined;

      let res = getEvmSecondsAndBlocks(3);
      await sdk.safeAdvanceTime(propCreatedResult.block + res.blocks);
      await sdk.castVote(propCreatedResult.proposalId, 1, true);
      res = getEvmSecondsAndBlocks(3);
      await sdk.advanceTime(String(res.secs), res.blocks);

      propQueuedResult = await sdk.queueProposal(propCreatedResult.proposalId);

      const propCreatedLogs = await getLogs({
        rpc: localRpc,
        contractAddresses: [sdk.contractAddrs.compound.governance],
        startingBlockNum: propCreatedResult.block,
        endingBlockNum: propCreatedResult.block + 1,
      });
      expect(propCreatedLogs.logs.length).to.equal(1);
      propCreatedLog = propCreatedLogs.logs[0];

      const propQueuedLogs = await getLogs({
        rpc: localRpc,
        contractAddresses: [sdk.contractAddrs.compound.governance],
        startingBlockNum: propQueuedResult.block,
        endingBlockNum: propQueuedResult.block + 1,
      });
      expect(propQueuedLogs.logs.length).to.equal(1);
      propQueuedLog = propQueuedLogs.logs[0];
    }).timeout(80_000);

    // TODO: do we want to fetch only up to currentBlock - 7 blocks to account for micro-reorgs?
    xit('should not fetch the most recent block', async () => {});
  });

  describe('parsing logs', () => {
    before(() => {
      expect(
        propCreatedLog,
        'Must have fetched the proposal created log to run this test',
      ).to.not.be.undefined;
      expect(
        propQueuedLog,
        'Must have fetched the proposal queued log to run this test',
      ).to.not.be.undefined;
    });

    it('should not throw if an invalid ABI is given for a contract address', async () => {
      let evmSource: EvmSource = {
        rpc: localRpc,
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

    it.skip('should not throw if a log cannot be parsed', async () => {
      expectAbi();

      const evmSource: EvmSource = {
        rpc: localRpc,
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
      expect(web3.utils.toChecksumAddress(events[0].rawLog.address)).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(events[0].eventSource.kind).to.equal('proposal-created');
      expect(parseInt(events[0].rawLog.blockNumber.toString(), 16)).to.equal(
        parseInt(propCreatedLog.blockNumber.toString()),
      );
      expect(events[0].parsedArgs).to.exist;
    });

    it('should only parse logs with a matching signature', async () => {
      expectAbi();

      const evmSource: EvmSource = {
        rpc: localRpc,
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
            ],
          },
        },
      };

      const events = await parseLogs(evmSource.contracts, [
        propCreatedLog,
        propQueuedLog,
      ]);
      expect(events.length).to.equal(1);
      expect(web3.utils.toChecksumAddress(events[0].rawLog.address)).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(events[0].eventSource.kind).to.equal('proposal-queued');
      expect(parseInt(events[0].rawLog.blockNumber.toString(), 16)).to.equal(
        parseInt(propQueuedLog.blockNumber.toString(), 16),
      );
      expect(events[0].parsedArgs).to.exist;
    });
  });

  // since all error handling tests are performed above there is no need to repeat these
  // tests here - as such this is a simple test to ensure normal functionality
  describe('getEvents', () => {
    before(() => {
      expectAbi();
      expect(
        propCreatedResult,
        'Must have created a proposal to run these test',
      ).to.not.be.undefined;
      expect(propQueuedResult, 'Must have queued a proposal to run these test')
        .to.not.be.undefined;
    });

    it('should return all fetched and parsed logs', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
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

      const currentBlockNum = (await sdk.getBlock()).number;
      const { events } = await getEvents(
        evmSource,
        currentBlockNum - propCreatedResult.block + 5,
      );
      expect(events.length).to.equal(2);

      const propCreatedEvent = events.find(
        (e) => e.eventSource.kind === 'proposal-created',
      );
      expect(propCreatedEvent).to.exist;
      expect(
        web3.utils.toChecksumAddress(propCreatedEvent.rawLog.address),
      ).to.equal(sdk.contractAddrs.compound.governance);
      expect(propCreatedEvent.eventSource.kind).to.equal('proposal-created');
      expect(
        parseInt(propCreatedEvent.rawLog.blockNumber.toString(), 16),
      ).to.equal(parseInt(propCreatedLog.blockNumber.toString()));
      expect(propCreatedEvent.parsedArgs).to.exist;

      const propQueuedEvent = events.find(
        (e) => e.eventSource.kind === 'proposal-queued',
      );
      expect(propQueuedEvent).to.exist;
      expect(
        web3.utils.toChecksumAddress(propQueuedEvent.rawLog.address),
      ).to.equal(sdk.contractAddrs.compound.governance);
      expect(propQueuedEvent.eventSource.kind).to.equal('proposal-queued');
      expect(
        parseInt(propQueuedEvent.rawLog.blockNumber.toString(), 16),
      ).to.equal(parseInt(propQueuedLog.blockNumber.toString()));
      expect(propQueuedEvent.parsedArgs).to.exist;
    });
  });

  // this cleans up the proposal cycle by executing the proposal
  // and advancing the chain 501 blocks past the max EVM CE range
});
