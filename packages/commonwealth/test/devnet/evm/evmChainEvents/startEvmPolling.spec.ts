import { ChainEventCreated, EventNames, dispose } from '@hicommonwealth/core';
import {
  CommunityStake,
  NamespaceFactory,
  communityStakesAbi,
  getAnvil,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-testing';
import { ChainNodeInstance, hashAbi, models } from '@hicommonwealth/model';
import { BalanceType, commonProtocol, delay } from '@hicommonwealth/shared';
import { Anvil } from '@viem/anvil';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { z } from 'zod';
import { startEvmPolling } from '../../../../server/workers/evmChainEvents/startEvmPolling';
import { localRpc } from './util';

const namespaceFactory = new NamespaceFactory();
const namespaceName = `cetest${new Date().getTime()}`;
const communityStake = new CommunityStake();
const namespaceDeployedSignature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const communityStakeTradeSignature =
  '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e';

describe('EVM Chain Events End to End Tests', () => {
  let anvil: Anvil | undefined;
  let namespaceDeployedBlock: number;
  let communityStakeBuyBlock: number;
  let communityStakeSellBlock: number;
  let chainNode: ChainNodeInstance;

  beforeAll(async () => {
    chainNode = await models.ChainNode.create({
      url: localRpc,
      balance_type: BalanceType.Ethereum,
      name: 'Local Base Sepolia',
      eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
      max_ce_block_range: -1,
    });
    const namespaceAbiInstance = await models.ContractAbi.create({
      abi: namespaceFactoryAbi,
      nickname: 'NamespaceFactory',
      abi_hash: hashAbi(namespaceFactoryAbi),
    });
    const stakesAbiInstance = await models.ContractAbi.create({
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

    anvil = await getAnvil(commonProtocol.ValidChains.SepoliaBase);

    let res = await namespaceFactory.deployNamespace(namespaceName);
    namespaceDeployedBlock = res.block;

    // emits a buy stake event
    await namespaceFactory.configureCommunityStakes(namespaceName, 2);

    res = await communityStake.buyStake(namespaceName, 2, 1);
    communityStakeBuyBlock = res.block;

    res = await communityStake.sellStake(namespaceName, 2, 1);
    communityStakeSellBlock = res.block;

    console.log(
      `Events located in blocks: ${namespaceDeployedBlock}, ${namespaceDeployedBlock + 1}, ${communityStakeBuyBlock}, and ${communityStakeSellBlock}`,
    );
  });

  afterAll(async () => {
    await anvil?.stop();
    await dispose()();
  });

  test(
    'should insert events into the outbox',
    { timeout: 80_000 },
    async () => {
      expect(await models.Outbox.count()).to.equal(0);
      let lastProcessedBlockNumber = await models.LastProcessedEvmBlock.findOne(
        {
          where: {
            chain_node_id: chainNode.id!,
          },
        },
      );
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
