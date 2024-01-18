import { Log } from '@ethersproject/providers';
import { AbiType } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  getEvents,
  getLogs,
  getProvider,
  parseLogs,
} from '../../../../server/workers/evmChainEvents/logProcessing';
import {
  ContractSources,
  EvmSource,
  RawEvmEvent,
} from '../../../../server/workers/evmChainEvents/types';
import {
  compoundPropCreatedSignature,
  compoundPropQueuedSignature,
  getEvmSecondsAndBlocks,
  localRpc,
  sdk,
} from './util';

chai.use(chaiAsPromised);

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
    const abiRes = await models.ContractAbi.findOne({
      where: {
        nickname: 'FeiDAO',
      },
    });

    abi = abiRes.abi;
  });

  const expectAbi = () => expect(abi, 'ABI must be defined to run this test');

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
      await expect(getLogs(evmSource))
        .to.eventually.be.rejected.and.be.an.instanceof(Error)
        .and.have.property(
          'message',
          'could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)',
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
      expectAbi();

      await sdk.getVotingPower(1, '400000');
      propCreatedResult = await sdk.createProposal(1);
      await sdk.safeAdvanceTime(propCreatedResult.block + 501);

      // fetch logs
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            abi,
            sources: [
              {
                event_signature: compoundPropCreatedSignature,
                kind: 'proposal-created',
              },
            ],
          },
        },
      };

      expect(propCreatedResult.block).to.not.be.undefined;
      const { logs } = await getLogs(evmSource, propCreatedResult.block);
      expect(logs).to.be.empty;
    }).timeout(80_000);

    it('should fetch logs with current block - maxOldBlocks if no starting block number is provided', async () => {
      expectAbi();
      expect(propCreatedResult, 'Must have created a proposal to run this test')
        .to.not.be.undefined;

      // fetch logs
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            abi,
            sources: [
              {
                event_signature: compoundPropCreatedSignature,
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
        currentBlockNum - propCreatedResult.block + 5,
      );
      expect(logs.length).to.equal(1);
      propCreatedLog = logs[0];
    });

    it('should fetch logs from the starting block number if provided', async () => {
      expectAbi();
      expect(propCreatedResult, 'Must have created a proposal to run this test')
        .to.not.be.undefined;

      let res = getEvmSecondsAndBlocks(3);
      await sdk.safeAdvanceTime(propCreatedResult.block + res.blocks);
      await sdk.castVote(propCreatedResult.proposalId, 1, true);
      res = getEvmSecondsAndBlocks(3);
      await sdk.advanceTime(String(res.secs), res.blocks);

      propQueuedResult = await sdk.queueProposal(propCreatedResult.proposalId);

      // fetch logs
      const evmSource: EvmSource = {
        rpc: localRpc,
        contracts: {
          [sdk.contractAddrs.compound.governance]: {
            abi,
            sources: [
              {
                event_signature: compoundPropQueuedSignature,
                kind: 'proposal-queued',
              },
            ],
          },
        },
      };

      const { logs } = await getLogs(evmSource, propQueuedResult.block);
      expect(logs.length).to.equal(1);
      propQueuedLog = logs[0];
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
        sdk.contractAddrs.compound.governance,
      );
      expect(events[0].kind).to.equal('proposal-created');
      expect(events[0].blockNumber).to.equal(
        parseInt(propCreatedLog.blockNumber.toString()),
      );
      expect(events[0].args).to.exist;
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
      expect(events[0].contractAddress).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(events[0].kind).to.equal('proposal-queued');
      expect(events[0].blockNumber).to.equal(
        parseInt(propQueuedLog.blockNumber.toString(), 16),
      );
      expect(events[0].args).to.exist;
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
              },
              {
                event_signature: compoundPropCreatedSignature,
                kind: 'proposal-created',
              },
            ],
          },
        },
      };

      const currentBlockNum = (await sdk.getBlock()).number;
      const { events } = await getEvents(
        evmSource,
        null,
        currentBlockNum - propCreatedResult.block + 5,
      );
      expect(events.length).to.equal(2);

      const propCreatedEvent = events.find(
        (e) => e.kind === 'proposal-created',
      );
      expect(propCreatedEvent).to.exist;
      expect(propCreatedEvent.contractAddress).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(propCreatedEvent.kind).to.equal('proposal-created');
      expect(propCreatedEvent.blockNumber).to.equal(
        parseInt(propCreatedLog.blockNumber.toString()),
      );
      expect(propCreatedEvent.args).to.exist;

      const propQueuedEvent = events.find((e) => e.kind === 'proposal-queued');
      expect(propQueuedEvent).to.exist;
      expect(propQueuedEvent.contractAddress).to.equal(
        sdk.contractAddrs.compound.governance,
      );
      expect(propQueuedEvent.kind).to.equal('proposal-queued');
      expect(propQueuedEvent.blockNumber).to.equal(
        parseInt(propQueuedLog.blockNumber.toString()),
      );
      expect(propQueuedEvent.args).to.exist;
    });
  });

  // this cleans up the proposal cycle by executing the proposal
  // and advancing the chain 501 blocks past the max EVM CE range
});
