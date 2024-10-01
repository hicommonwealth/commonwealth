import { Log } from '@ethersproject/providers';
import { dispose } from '@hicommonwealth/core';
import {
  CommunityStake,
  NamespaceFactory,
  communityStakesAbi,
  getAnvil,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-testing';
import { equalEvmAddresses } from '@hicommonwealth/model';
import { AbiType, commonProtocol } from '@hicommonwealth/shared';
import { Anvil } from '@viem/anvil';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  getEvents,
  getLogs,
  getProvider,
  parseLogs,
} from '../../../../server/workers/evmChainEvents/logProcessing';
import {
  ContractSources,
  EvmSource,
} from '../../../../server/workers/evmChainEvents/types';
import { localRpc } from './util';

const namespaceDeployedLog = {
  address: '0xd8a357847caba76133d5f2cb51317d3c74609710',
  topics: [
    '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
  ],
  data: '0x0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000001363657465737431373237373734373236393138000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  blockHash:
    '0x5aa2154c16dca3b09a11a8a6f06154b2263c1185f3ef7edb99e8f5099d95083b',
  blockNumber: 16003219,
  blockTimestamp: '0x66fbc006',
  transactionHash:
    '0x42c646d126f850e575c0ead5692655670b09ec4baf5d0eca74d6ee75af5fc311',
  transactionIndex: 0,
  logIndex: 4,
  removed: false,
};
const namespaceFactoryAddress =
  commonProtocol.factoryContracts[84532].factory.toLowerCase();
const namespaceDeployedSignature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const namespaceFactory = new NamespaceFactory();
const namespaceName = `cetest${new Date().getTime()}`;

const communityStakeAddress =
  commonProtocol.factoryContracts[84532].communityStake.toLowerCase();
const communityStakeTradeSignature =
  '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e';
const communityStake = new CommunityStake();

describe('EVM Chain Events Log Processing Tests', () => {
  let namespaceDeployedBlock: number;
  let communityStakeBuyBlock: number;
  let communityStakeSellBlock: number;
  let anvil: Anvil;

  beforeAll(async () => {
    anvil = await getAnvil({}, true);

    let res = await namespaceFactory.deployNamespace(namespaceName);
    namespaceDeployedBlock = res.block;

    // emits a buy stake event
    await namespaceFactory.configureCommunityStakes(namespaceName, 2);

    res = await communityStake.buyStake(namespaceName, 2, 1);
    communityStakeBuyBlock = res.block;

    res = await communityStake.sellStake(namespaceName, 2, 1);
    communityStakeSellBlock = res.block;
  });

  afterAll(async () => {
    await anvil.stop();
    await dispose()();
  });

  describe('fetching logs', () => {
    test('should not return any logs if no contract addresses are given', async () => {
      const provider = getProvider(localRpc);
      const currentBlockNum = await provider.getBlockNumber();

      const { logs } = await getLogs({
        rpc: localRpc,
        maxBlockRange: 50,
        contractAddresses: [],
        startingBlockNum: currentBlockNum - 10,
        endingBlockNum: currentBlockNum,
      });
      expect(logs).to.be.empty;
    });

    test('should throw if the provider cannot be connected to', async () => {
      try {
        await getLogs({
          rpc: 'http://fake',
          maxBlockRange: 500,
          contractAddresses: ['0x1'],
          startingBlockNum: 1,
          endingBlockNum: 2,
        });
        expect.fail();
      } catch (e) {
        expect(e).toHaveProperty('message');
        expect(e.message.includes('code=SERVER_ERROR')).toBeTruthy();
      }
    });

    test('should not throw if the starting block number is greater than the current block number', async () => {
      const provider = getProvider(localRpc);
      const currentBlockNum = await provider.getBlockNumber();
      const res = await getLogs({
        rpc: localRpc,
        maxBlockRange: 500,
        contractAddresses: ['0x1'],
        startingBlockNum: currentBlockNum + 1000,
        endingBlockNum: 1,
      });
      expect(res.lastBlockNum).to.equal(1);
    });

    test(
      'should fetch logs from the specified range',
      { timeout: 360_000 },
      async () => {
        const emptyRes = await getLogs({
          rpc: localRpc,
          maxBlockRange: 10,
          contractAddresses: [commonProtocol.factoryContracts[84532].factory],
          startingBlockNum: namespaceDeployedBlock - 11,
          endingBlockNum: namespaceDeployedBlock - 1,
        });
        expect(emptyRes.logs.length).to.equal(0);
        expect(emptyRes.lastBlockNum).to.equal(namespaceDeployedBlock - 1);

        const res = await getLogs({
          rpc: localRpc,
          maxBlockRange: 500,
          contractAddresses: [commonProtocol.factoryContracts[84532].factory],
          startingBlockNum: namespaceDeployedBlock,
          endingBlockNum: namespaceDeployedBlock,
        });
        expect(res.logs.length).to.equal(1);
        expect(res.lastBlockNum).to.equal(namespaceDeployedBlock);
      },
    );
  });

  describe('parsing logs', () => {
    test('should not throw if an invalid ABI is given for a contract address', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [namespaceFactoryAddress]: {
            sources: [
              {
                event_signature: namespaceDeployedSignature,
                kind: 'DeployedNamespace',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: '0x1',
              },
            ],
          },
        } as ContractSources,
      };

      let result = await parseLogs(evmSource.contracts, [namespaceDeployedLog]);
      expect(result.length).to.equal(0);

      evmSource.contracts[namespaceFactoryAddress].abi =
        'invalid abi' as unknown as AbiType;
      result = await parseLogs(evmSource.contracts, [namespaceDeployedLog]);
      expect(result.length).to.equal(0);

      evmSource.contracts[namespaceFactoryAddress].abi = [];
      result = await parseLogs(evmSource.contracts, [namespaceDeployedLog]);
      expect(result.length).to.equal(0);
    });

    test('should only parse logs with a matching signature', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [namespaceFactoryAddress]: {
            abi: namespaceFactoryAbi,
            sources: [
              {
                event_signature: namespaceDeployedSignature,
                kind: 'DeployedNamespace',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: namespaceFactoryAddress,
              },
            ],
          },
        },
      };

      const events = await parseLogs(evmSource.contracts, [
        namespaceDeployedLog,
        {
          address: '0xd8a357847caba76133d5f2cb51317d3c74609710',
          topics: ['0xfake_topic'],
        } as Log,
      ]);
      expect(events.length).to.equal(1);
      expect(
        equalEvmAddresses(events[0].rawLog.address, namespaceFactoryAddress),
      ).toBeTruthy();

      expect(events[0].eventSource.kind).to.equal('DeployedNamespace');
      expect(events[0].rawLog.blockNumber).to.equal(
        namespaceDeployedLog.blockNumber,
      );
      expect(events[0].parsedArgs).to.exist;
    });
  });

  describe('get and migrate events', () => {
    test('should return all fetched and parsed logs', async () => {
      const evmSource: EvmSource = {
        rpc: localRpc,
        maxBlockRange: -1,
        contracts: {
          [namespaceFactoryAddress]: {
            abi: namespaceFactoryAbi,
            sources: [
              {
                event_signature: namespaceDeployedSignature,
                kind: 'DeployedNamespace',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: namespaceFactoryAddress,
              },
            ],
          },
          [communityStakeAddress]: {
            abi: communityStakesAbi,
            sources: [
              {
                event_signature: communityStakeTradeSignature,
                kind: 'Trade',
                abi_id: 1,
                chain_node_id: 1,
                contract_address: communityStakeAddress,
              },
            ],
          },
        },
      };

      let result = await getEvents(
        evmSource,
        namespaceDeployedBlock,
        communityStakeBuyBlock,
      );
      // namespace deployed + configure stake buy event + explicit buy event
      expect(result.events.length).to.equal(3);
      const deployedNamespaceEvent = result.events.find(
        (e) => e.eventSource.kind === 'DeployedNamespace',
      );
      expect(deployedNamespaceEvent).toBeTruthy();
      expect(deployedNamespaceEvent!.rawLog.address).to.equal(
        namespaceFactoryAddress,
      );
      const communityStakeBuyEvent = result.events.find(
        (e) => e.eventSource.kind === 'Trade',
      );
      expect(communityStakeBuyEvent).toBeTruthy();
      expect(communityStakeBuyEvent!.rawLog.address).to.equal(
        communityStakeAddress,
      );

      result = await getEvents(
        evmSource,
        communityStakeBuyBlock + 1,
        communityStakeSellBlock,
      );
      expect(result.events.length).to.equal(1);
      const communityStakeSellEvent = result.events.find(
        (e) => e.eventSource.kind === 'Trade',
      );
      expect(communityStakeSellEvent).toBeTruthy();
      expect(communityStakeSellEvent!.rawLog.address).to.equal(
        communityStakeAddress,
      );
    });
  });
});
