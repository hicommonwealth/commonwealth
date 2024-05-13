import {
  EventNames,
  events as coreEvents,
  dispose,
} from '@hicommonwealth/core';
import { getAnvil } from '@hicommonwealth/evm-testing';
import { tester, type ContractInstance, type DB } from '@hicommonwealth/model';
import { delay } from '@hicommonwealth/shared';
import { Anvil } from '@viem/anvil';
import { expect } from 'chai';
import { z } from 'zod';
import { startEvmPolling } from '../../../../server/workers/evmChainEvents/startEvmPolling';
import {
  getTestAbi,
  getTestChainNode,
  getTestContract,
  getTestSignatures,
} from '../../../integration/evmChainEvents/util';
import { sdk } from './util';

describe('EVM Chain Events End to End Tests', () => {
  let models: DB;
  let anvil: Anvil;

  let propCreatedResult: { block: number; proposalId: string };
  let contract: ContractInstance;

  async function verifyBlockNumber(
    chainNodeId: number,
    blockNumber: null | number,
  ) {
    const lastBlock = await models.LastProcessedEvmBlock.findOne({
      where: {
        chain_node_id: chainNodeId,
      },
    });

    let lastBlockNum: number;
    if (!lastBlock && blockNumber === null) {
      return;
    } else if (!lastBlock && blockNumber !== null) {
      throw new Error('Last processed block not found');
    } else {
      lastBlockNum = lastBlock.block_number;
    }

    if (blockNumber === null) {
      expect(lastBlockNum).to.be.null;
    } else {
      expect(lastBlockNum).to.be.gte(blockNumber);
    }
  }

  before(async () => {
    models = await tester.seedDb();
    anvil = await getAnvil();
    const currentBlock = Number((await sdk.getBlock()).number);
    // advance time to avoid test interaction issues
    await sdk.safeAdvanceTime(currentBlock + 501);
    await models.LastProcessedEvmBlock.destroy({
      where: {},
    });
    await models.EvmEventSource.destroy({
      where: {},
    });
  });

  after(async () => {
    await anvil.stop();
    await dispose()();
  });

  it('should insert events into the outbox', async () => {
    const chainNode = await getTestChainNode();
    const abi = await getTestAbi();
    contract = await getTestContract();
    await contract.update({ abi_id: abi.id });
    await getTestSignatures();

    // create proposal notification
    await sdk.getVotingPower(1, '400000');
    propCreatedResult = await sdk.createProposal(1);
    console.log(
      `Proposal created at block ${propCreatedResult.block} with id ${propCreatedResult.proposalId}`,
    );

    expect(await models.Outbox.count()).to.equal(0);
    await verifyBlockNumber(contract.chain_node_id, null);

    const intervalId = await startEvmPolling(10_000);
    clearInterval(intervalId);

    await delay(5000);
    await verifyBlockNumber(contract.chain_node_id, propCreatedResult.block);

    const events = await models.Outbox.findAll();
    expect(events.length).to.equal(1);
    expect(events[0]?.event_name).to.equal(EventNames.ChainEventCreated);

    const event = events[0].event_payload as z.infer<
      typeof coreEvents.ChainEventCreated
    >;

    expect(event.eventSource).to.deep.equal({
      kind: 'proposal-created',
      chainNodeId: chainNode.id,
      eventSignature:
        '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
    });
    expect(event.parsedArgs).to.exist;
    expect(event.rawLog).to.exist;
  }).timeout(80_000);
});
