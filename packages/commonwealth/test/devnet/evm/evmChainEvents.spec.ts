import { Log } from '@ethersproject/providers';
import { ChainEventCreated, dispose, EventNames } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import {
  CommunityStake,
  communityStakesAbi,
  getAnvil,
  localRpc,
  NamespaceFactory,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-testing';
import {
  ChainNodeInstance,
  equalEvmAddresses,
  hashAbi,
  models,
} from '@hicommonwealth/model';
import { AbiType, BalanceType, delay } from '@hicommonwealth/shared';
import { Anvil } from '@viem/anvil';
import { bootstrap_testing } from 'node_modules/@hicommonwealth/model/src/tester';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  getEvents,
  getLogs,
  getProvider,
  parseLogs,
} from '../../../server/workers/evmChainEvents/logProcessing';
import { startEvmPolling } from '../../../server/workers/evmChainEvents/startEvmPolling';
import {
  ContractSources,
  EvmSource,
} from '../../../server/workers/evmChainEvents/types';

const namespaceDeployedLog = {
  address: '0xd8a357847caba76133d5f2cb51317d3c74609710',
  topics: [
    '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
  ],
  // eslint-disable-next-line max-len
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
  commonProtocol.factoryContracts[
    commonProtocol.ValidChains.SepoliaBase
  ].factory.toLowerCase();
const namespaceDeployedSignature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const namespaceFactory = new NamespaceFactory();
const namespaceName = `cetest${new Date().getTime()}`;

const communityStakeAddress =
  commonProtocol.factoryContracts[
    commonProtocol.ValidChains.SepoliaBase
  ].communityStake.toLowerCase();
const communityStakeTradeSignature =
  '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e';
const communityStake = new CommunityStake();

describe('EVM Chain Events Devnet Tests', () => {
  let namespaceDeployedBlock: number;
  let communityStakeBuyBlock: number;
  let communityStakeSellBlock: number;
  let anvil: Anvil | undefined;

  beforeAll(async () => {
    anvil = await getAnvil(commonProtocol.ValidChains.SepoliaBase);

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
    await anvil?.stop();
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
          contractAddresses: [
            commonProtocol.factoryContracts[
              commonProtocol.ValidChains.SepoliaBase
            ].factory,
          ],
          startingBlockNum: namespaceDeployedBlock - 11,
          endingBlockNum: namespaceDeployedBlock - 1,
        });
        expect(emptyRes.logs.length).to.equal(0);
        expect(emptyRes.lastBlockNum).to.equal(namespaceDeployedBlock - 1);

        const res = await getLogs({
          rpc: localRpc,
          maxBlockRange: 500,
          contractAddresses: [
            commonProtocol.factoryContracts[
              commonProtocol.ValidChains.SepoliaBase
            ].factory,
          ],
          startingBlockNum: namespaceDeployedBlock,
          endingBlockNum: namespaceDeployedBlock,
        });
        expect(res.logs.length).to.equal(1);
        expect(res.lastBlockNum).to.equal(namespaceDeployedBlock);
      },
    );
  });

  // TODO: move to parallel unit tests
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
      expect(
        equalEvmAddresses(
          deployedNamespaceEvent!.rawLog.address,
          namespaceFactoryAddress,
        ),
      ).toBeTruthy();
      const communityStakeBuyEvent = result.events.find(
        (e) => e.eventSource.kind === 'Trade',
      );
      expect(communityStakeBuyEvent).toBeTruthy();
      expect(
        equalEvmAddresses(
          communityStakeBuyEvent!.rawLog.address,
          communityStakeAddress,
        ),
      ).toBeTruthy();

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
      expect(
        equalEvmAddresses(
          communityStakeSellEvent!.rawLog.address,
          communityStakeAddress,
        ),
      ).toBeTruthy();
    });
  });
  describe('EVM Chain Events End to End Tests', () => {
    let chainNode: ChainNodeInstance;

    beforeAll(async () => {
      // bootstrapping here to reset the db
      // and avoid conflicts with other tests using same chain
      await bootstrap_testing();

      chainNode = await models.ChainNode.create({
        url: localRpc,
        balance_type: BalanceType.Ethereum,
        name: 'Local Base Sepolia',
        eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
        max_ce_block_range: -1,
      });
      const namespaceAbiInstance = await models.ContractAbi.create({
        id: 1,
        abi: namespaceFactoryAbi,
        nickname: 'NamespaceFactory',
        abi_hash: hashAbi(namespaceFactoryAbi),
      });
      const stakesAbiInstance = await models.ContractAbi.create({
        id: 2,
        abi: communityStakesAbi,
        nickname: 'CommunityStakes',
        abi_hash: hashAbi(communityStakesAbi),
      });
      await models.EvmEventSource.bulkCreate([
        {
          chain_node_id: chainNode.id!,
          contract_address:
            commonProtocol.factoryContracts[
              commonProtocol.ValidChains.SepoliaBase
            ].factory.toLowerCase(),
          event_signature: namespaceDeployedSignature,
          kind: 'DeployedNamespace',
          abi_id: namespaceAbiInstance.id!,
        },
        {
          chain_node_id: chainNode.id!,
          contract_address:
            commonProtocol.factoryContracts[
              commonProtocol.ValidChains.SepoliaBase
            ].communityStake.toLowerCase(),
          event_signature: communityStakeTradeSignature,
          kind: 'Trade',
          abi_id: stakesAbiInstance.id!,
        },
      ]);
    });

    test(
      'should insert events into the outbox',
      { timeout: 80_000 },
      async () => {
        expect(await models.Outbox.count()).to.equal(0);
        let lastProcessedBlockNumber =
          await models.LastProcessedEvmBlock.findOne({
            where: {
              chain_node_id: chainNode.id!,
            },
          });
        expect(lastProcessedBlockNumber).toBeFalsy();

        const intervalId = await startEvmPolling(10_000);
        clearInterval(intervalId);

        await delay(5000);

        lastProcessedBlockNumber = await models.LastProcessedEvmBlock.findOne({
          where: {
            chain_node_id: chainNode.id!,
          },
        });
        // should stop before the current block to minimize chain re-org impact
        expect(lastProcessedBlockNumber?.block_number).to.be.greaterThanOrEqual(
          communityStakeSellBlock - 1,
        );

        const events = (await models.Outbox.findAll()) as unknown as Array<{
          event_name: EventNames.ChainEventCreated;
          event_payload: z.infer<typeof ChainEventCreated>;
        }>;
        expect(events.length).to.equal(3);
        for (const { event_name } of events) {
          expect(event_name).to.equal(EventNames.ChainEventCreated);
        }

        expect(events[0].event_payload.eventSource).to.deep.equal({
          kind: 'DeployedNamespace',
          chainNodeId: chainNode.id!,
          eventSignature: namespaceDeployedSignature,
        });
        expect(events[1].event_payload.eventSource).to.deep.equal({
          kind: 'Trade',
          chainNodeId: chainNode.id!,
          eventSignature: communityStakeTradeSignature,
        });
        expect(events[2].event_payload.eventSource).to.deep.equal({
          kind: 'Trade',
          chainNodeId: chainNode.id!,
          eventSignature: communityStakeTradeSignature,
        });
      },
    );
  });
});
