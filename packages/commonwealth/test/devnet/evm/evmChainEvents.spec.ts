import { dispose } from '@hicommonwealth/core';
import {
  ChildContractNames,
  EvmEventSignatures,
  commonProtocol,
  getBlockNumber,
} from '@hicommonwealth/evm-protocols';
import {
  CommunityStake,
  NamespaceFactory,
  getAnvil,
  localRpc,
  mineBlocks,
} from '@hicommonwealth/evm-testing';
import {
  ChainNodeInstance,
  EvmChainSource,
  LastProcessedEvmBlockInstance,
  Log,
  createEventRegistryChainNodes,
  equalEvmAddresses,
  models,
} from '@hicommonwealth/model';
import { EventPair } from '@hicommonwealth/schemas';
import { Anvil } from '@viem/anvil';
import { Op } from 'sequelize';
import {
  MockInstance,
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {
  getEvents,
  getLogs,
  migrateEvents,
  parseLogs,
} from '../../../server/workers/evmChainEvents/logProcessing';
import { startEvmPolling } from '../../../server/workers/evmChainEvents/startEvmPolling';

vi.mock('../../../server/workers/evmChainEvents/getEventSources');

const namespaceDeployedLog = {
  address:
    commonProtocol.factoryContracts[commonProtocol.ValidChains.SepoliaBase]
      .factory,
  topics: [EvmEventSignatures.NamespaceFactory.NamespaceDeployed],
  // eslint-disable-next-line max-len
  data: '0x0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000001363657465737431373237373734373236393138000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  blockHash:
    '0x5aa2154c16dca3b09a11a8a6f06154b2263c1185f3ef7edb99e8f5099d95083b',
  blockNumber: 16003219n,
  blockTimestamp: '0x66fbc006',
  transactionHash:
    '0x42c646d126f850e575c0ead5692655670b09ec4baf5d0eca74d6ee75af5fc311',
  transactionIndex: 0,
  logIndex: 4,
  removed: false,
};
const namespaceFactoryAddress =
  commonProtocol.factoryContracts[commonProtocol.ValidChains.SepoliaBase]
    .factory;
const namespaceFactory = new NamespaceFactory();
const namespaceName = `cetest${new Date().getTime()}`;

const communityStakeAddress =
  commonProtocol.factoryContracts[commonProtocol.ValidChains.SepoliaBase]
    .communityStake;
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
      const currentBlockNum = await getBlockNumber({ rpc: localRpc });
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
        expect(e.message.includes('fetch failed')).toBeTruthy();
      }
    });

    test('should not throw if the starting block number is greater than the current block number', async () => {
      const currentBlockNum = await getBlockNumber({ rpc: localRpc });
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

        Object.keys(namespaceDeployedLog).forEach((key) => {
          expect(res.logs[0]).toHaveProperty(key);
        });
        expect(Object.keys(namespaceDeployedLog).length).to.equal(
          Object.keys(res.logs[0]).length,
        );

        // returned contract address can be lowercase
        expect(res.logs[0].address).to.equal(
          namespaceFactoryAddress.toLowerCase(),
        );
        expect(res.lastBlockNum).to.equal(namespaceDeployedBlock);
      },
    );
  });

  describe('parsing logs', () => {
    test('should only parse logs with a matching signature', async () => {
      const evmSource: EvmChainSource = {
        rpc: localRpc,
        maxBlockRange: 500,
        contracts: {
          [namespaceFactoryAddress]: [
            {
              event_signature:
                EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
              eth_chain_id: 1,
              contract_address: namespaceFactoryAddress,
              meta: {
                events_migrated: true,
              },
            },
          ],
        },
      };

      const events = await parseLogs(
        evmSource.contracts,
        [
          namespaceDeployedLog,
          {
            address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.SepoliaBase
              ].factory,
            topics: ['0xfake_topic'],
          } as Log,
        ],
        {},
      );
      expect(events.length).to.equal(1);
      const event: EventPair<'NamespaceDeployed'> =
        events[0] as EventPair<'NamespaceDeployed'>;
      expect(
        equalEvmAddresses(
          event.event_payload.rawLog.address,
          namespaceFactoryAddress,
        ),
      ).toBeTruthy();

      expect(event.event_payload.rawLog.blockNumber).to.equal(
        namespaceDeployedLog.blockNumber,
      );
      expect(event.event_payload.parsedArgs).to.exist;
    });
  });

  describe('get and migrate events', () => {
    test('should return all fetched and parsed logs', async () => {
      const evmSource: EvmChainSource = {
        rpc: localRpc,
        maxBlockRange: -1,
        contracts: {
          [namespaceFactoryAddress]: [
            {
              event_signature:
                EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
              eth_chain_id: 1,
              contract_address: namespaceFactoryAddress,
              meta: {
                events_migrated: true,
              },
            },
          ],
          [communityStakeAddress]: [
            {
              event_signature: EvmEventSignatures.CommunityStake.Trade,
              eth_chain_id: 1,
              contract_address: communityStakeAddress,
              meta: {
                events_migrated: true,
              },
            },
          ],
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
        (e) => e.event_name === 'NamespaceDeployed',
      ) as EventPair<'NamespaceDeployed'> | undefined;
      expect(deployedNamespaceEvent).toBeTruthy();
      expect(
        equalEvmAddresses(
          deployedNamespaceEvent!.event_payload.rawLog.address,
          namespaceFactoryAddress,
        ),
      ).toBeTruthy();
      const communityStakeBuyEvent = result.events.find(
        (e) => e.event_name === 'CommunityStakeTrade',
      ) as EventPair<'CommunityStakeTrade'> | undefined;
      expect(communityStakeBuyEvent).toBeTruthy();
      expect(
        equalEvmAddresses(
          communityStakeBuyEvent!.event_payload.rawLog.address,
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
        (e) => e.event_name === 'CommunityStakeTrade',
      ) as EventPair<'CommunityStakeTrade'> | undefined;
      expect(communityStakeSellEvent).toBeTruthy();
      expect(
        equalEvmAddresses(
          communityStakeSellEvent!.event_payload.rawLog.address,
          communityStakeAddress,
        ),
      ).toBeTruthy();
    });

    test('should migrate events', async () => {
      const evmSource: EvmChainSource = {
        rpc: localRpc,
        maxBlockRange: -1,
        contracts: {
          [namespaceFactoryAddress]: [
            {
              event_signature:
                EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
              eth_chain_id: 1,
              contract_address: namespaceFactoryAddress,
              meta: {
                created_at_block: namespaceDeployedBlock,
                events_migrated: false,
              },
            },
          ],
        },
      };

      const result = await migrateEvents(evmSource, namespaceDeployedBlock + 1);
      if (!('events' in result)) {
        throw new Error('result does not have events');
      }
      expect(result?.events.length).to.equal(1);
      const deployedNamespaceEvent = result!.events.find(
        (e) => e.event_name === 'NamespaceDeployed',
      ) as EventPair<'NamespaceDeployed'> | undefined;
      expect(deployedNamespaceEvent).toBeTruthy();
      expect(
        equalEvmAddresses(
          deployedNamespaceEvent!.event_payload.rawLog.address,
          namespaceFactoryAddress,
        ),
      ).toBeTruthy();
    });
  });

  describe('EVM Chain Events End to End Tests', () => {
    const sepoliaBaseChainId = commonProtocol.ValidChains.SepoliaBase;

    let chainNode: ChainNodeInstance;

    beforeAll(async () => {
      const chainNodes = await createEventRegistryChainNodes();
      const sepoliaBaseChainNode = chainNodes.find(
        (c) => c.eth_chain_id === commonProtocol.ValidChains.SepoliaBase,
      );
      sepoliaBaseChainNode!.url = localRpc;
      sepoliaBaseChainNode!.private_url = localRpc;
      await sepoliaBaseChainNode!.save();
      chainNode = sepoliaBaseChainNode!;
    });

    afterEach(async () => {
      vi.resetAllMocks();
      await models.LastProcessedEvmBlock.truncate();
      await models.Outbox.truncate();
      await models.EvmEventSource.truncate();
    });

    test(
      'should insert events into the outbox',
      { timeout: 80_000 },
      async () => {
        const stakeAddress =
          commonProtocol.factoryContracts[sepoliaBaseChainId].communityStake;

        const { getEventSources } = await import(
          '../../../server/workers/evmChainEvents/getEventSources'
        );
        (getEventSources as unknown as MockInstance).mockImplementation(
          async () =>
            Promise.resolve({
              [sepoliaBaseChainId]: {
                rpc: localRpc,
                maxBlockRange: 500,
                contracts: {
                  [namespaceFactoryAddress]: [
                    {
                      eth_chain_id: sepoliaBaseChainId,
                      contract_address: namespaceFactoryAddress,
                      event_signature:
                        EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
                      meta: {
                        events_migrated: true,
                      },
                    },
                  ],
                  [stakeAddress]: [
                    {
                      eth_chain_id: sepoliaBaseChainId,
                      contract_address: stakeAddress,
                      event_signature: EvmEventSignatures.CommunityStake.Trade,
                      meta: {
                        events_migrated: true,
                      },
                    },
                  ],
                },
              } as EvmChainSource,
            }),
        );

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

        await vi.waitUntil(
          async () => {
            lastProcessedBlockNumber =
              await models.LastProcessedEvmBlock.findOne({
                where: {
                  chain_node_id: chainNode.id!,
                },
              });
            return !!lastProcessedBlockNumber;
          },
          {
            timeout: 5_000,
            interval: 200,
          },
        );

        // should stop before the current block to minimize chain re-org impact
        expect(lastProcessedBlockNumber?.block_number).to.be.greaterThanOrEqual(
          communityStakeSellBlock - 1,
        );

        const events = await models.Outbox.findAll();
        expect(events.length).to.equal(3);
        for (const { event_name } of events) {
          expect(
            ['CommunityStakeTrade', 'NamespaceDeployed'].includes(event_name),
          ).to.be.true;
        }

        expect(events[0].event_payload.eventSource).to.deep.equal({
          ethChainId: chainNode.eth_chain_id!,
          eventSignature: EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
        });
        expect(events[1].event_payload.eventSource).to.deep.equal({
          ethChainId: chainNode.eth_chain_id!,
          eventSignature: EvmEventSignatures.CommunityStake.Trade,
        });
        expect(events[2].event_payload.eventSource).to.deep.equal({
          ethChainId: chainNode.eth_chain_id!,
          eventSignature: EvmEventSignatures.CommunityStake.Trade,
        });
      },
    );

    async function testEventMigration(lastProcessedBlock?: number) {
      const evmEventSource = await models.EvmEventSource.create({
        eth_chain_id: sepoliaBaseChainId,
        contract_address: namespaceFactoryAddress,
        event_signature: EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
        created_at_block: namespaceDeployedBlock,
        events_migrated: false,
        // Unrelated to NamespaceFactory tests here but required for type
        contract_name: ChildContractNames.SingleContest,
        parent_contract_address: '',
      });

      const fakeEvmEventSource = await models.EvmEventSource.create({
        eth_chain_id: 1,
        contract_address: namespaceFactoryAddress,
        event_signature: EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
        created_at_block: namespaceDeployedBlock,
        events_migrated: false,
        // Unrelated to NamespaceFactory tests here but required for type
        contract_name: ChildContractNames.SingleContest,
        parent_contract_address: '',
      });

      const { getEventSources } = await import(
        '../../../server/workers/evmChainEvents/getEventSources'
      );
      (getEventSources as unknown as MockInstance).mockImplementation(
        async () =>
          Promise.resolve({
            [sepoliaBaseChainId]: {
              rpc: localRpc,
              maxBlockRange: 500,
              contracts: {
                [namespaceFactoryAddress]: [
                  {
                    eth_chain_id: sepoliaBaseChainId,
                    contract_address: namespaceFactoryAddress,
                    event_signature:
                      EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
                    meta: {
                      created_at_block: namespaceDeployedBlock,
                      events_migrated: false,
                    },
                  },
                ],
              },
            } as EvmChainSource,
          }),
      );

      expect(await models.Outbox.count()).to.equal(0);

      const latestBlockNum = await getBlockNumber({
        rpc: localRpc,
      });

      // simulate last processed block being higher than namespaceDeployedBlock
      await mineBlocks(10);
      expect(latestBlockNum).to.be.greaterThan(namespaceDeployedBlock);
      await models.LastProcessedEvmBlock.create({
        chain_node_id: chainNode.id!,
        block_number: lastProcessedBlock || latestBlockNum - 3,
      });

      const intervalId = await startEvmPolling(10_000);
      clearInterval(intervalId);

      let lastProcessedBlockNumber:
        | LastProcessedEvmBlockInstance
        | undefined
        | null;
      await vi.waitUntil(
        async () => {
          lastProcessedBlockNumber = await models.LastProcessedEvmBlock.findOne(
            {
              where: {
                chain_node_id: chainNode.id!,
                block_number: {
                  [Op.gte]: latestBlockNum - 1,
                },
              },
            },
          );
          return !!lastProcessedBlockNumber;
        },
        {
          timeout: 5_000,
          interval: 200,
        },
      );

      // should stop before the current block to minimize chain re-org impact
      expect(lastProcessedBlockNumber?.block_number).to.be.greaterThanOrEqual(
        latestBlockNum - 1,
      );

      const events = await models.Outbox.findAll();
      expect(events.length).to.equal(1);
      expect(events[0].event_name).to.equal('NamespaceDeployed');

      expect(events[0].event_payload.eventSource).to.deep.equal({
        ethChainId: chainNode.eth_chain_id!,
        eventSignature: EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
      });

      await evmEventSource.reload();
      expect(evmEventSource.events_migrated).to.be.true;
      await fakeEvmEventSource.reload();
      expect(fakeEvmEventSource.events_migrated).to.be.false;
    }

    test(
      'should migrate events into the outbox',
      { timeout: 80_000 },
      async () => {
        await testEventMigration();
      },
    );

    test(
      'should mark unmigrated events as migrated even when fetched without migrateEvents',
      { timeout: 80_000 },
      async () => {
        await testEventMigration(namespaceDeployedBlock - 1);
      },
    );

    test(
      'should migrate event when below last processed block',
      { timeout: 80_000 },
      async () => {
        await testEventMigration(namespaceDeployedBlock + 1);
      },
    );

    test(
      'should migrate event when at last processed block',
      { timeout: 80_000 },
      async () => {
        await testEventMigration(namespaceDeployedBlock);
      },
    );

    test(
      'should update EVM event sources event when no events are found',
      { timeout: 80_000 },
      async () => {
        const evmEventSource = await models.EvmEventSource.create({
          eth_chain_id: sepoliaBaseChainId,
          contract_address: namespaceFactoryAddress,
          event_signature:
            EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
          created_at_block: namespaceDeployedBlock,
          events_migrated: false,
          // Unrelated to NamespaceFactory tests here but required for type
          contract_name: ChildContractNames.SingleContest,
          parent_contract_address: '',
        });

        const fakeEvmEventSource = await models.EvmEventSource.create({
          eth_chain_id: 1,
          contract_address: namespaceFactoryAddress,
          event_signature:
            EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
          created_at_block: namespaceDeployedBlock,
          events_migrated: false,
          // Unrelated to NamespaceFactory tests here but required for type
          contract_name: ChildContractNames.SingleContest,
          parent_contract_address: '',
        });

        await mineBlocks(10);
        const latestBlockNum = await getBlockNumber({
          rpc: localRpc,
        });

        const { getEventSources } = await import(
          '../../../server/workers/evmChainEvents/getEventSources'
        );
        (getEventSources as unknown as MockInstance).mockImplementation(
          async () =>
            Promise.resolve({
              [sepoliaBaseChainId]: {
                rpc: localRpc,
                maxBlockRange: 500,
                contracts: {
                  [namespaceFactoryAddress]: [
                    {
                      eth_chain_id: sepoliaBaseChainId,
                      contract_address: namespaceFactoryAddress,
                      event_signature:
                        EvmEventSignatures.NamespaceFactory.NamespaceDeployed,
                      meta: {
                        created_at_block: latestBlockNum - 5,
                        events_migrated: false,
                      },
                    },
                  ],
                },
              } as EvmChainSource,
            }),
        );

        expect(await models.Outbox.count()).to.equal(0);

        expect(latestBlockNum).to.be.greaterThan(namespaceDeployedBlock);
        await models.LastProcessedEvmBlock.create({
          chain_node_id: chainNode.id!,
          block_number: latestBlockNum - 3,
        });

        const intervalId = await startEvmPolling(10_000);
        clearInterval(intervalId);

        let lastProcessedBlockNumber:
          | LastProcessedEvmBlockInstance
          | undefined
          | null;
        await vi.waitUntil(
          async () => {
            lastProcessedBlockNumber =
              await models.LastProcessedEvmBlock.findOne({
                where: {
                  chain_node_id: chainNode.id!,
                  block_number: {
                    [Op.gte]: latestBlockNum - 1,
                  },
                },
              });
            return !!lastProcessedBlockNumber;
          },
          {
            timeout: 5_000,
            interval: 200,
          },
        );

        // should stop before the current block to minimize chain re-org impact
        expect(lastProcessedBlockNumber?.block_number).to.be.greaterThanOrEqual(
          latestBlockNum - 1,
        );

        const events = await models.Outbox.findAll();
        expect(events.length).to.equal(0);

        await evmEventSource.reload();
        expect(evmEventSource.events_migrated).to.be.true;
        await fakeEvmEventSource.reload();
        expect(fakeEvmEventSource.events_migrated).to.be.false;
      },
    );
  });
});
