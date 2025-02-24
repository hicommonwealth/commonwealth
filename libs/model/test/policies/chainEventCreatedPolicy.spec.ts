import { EventContext, dispose } from '@hicommonwealth/core';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { createTestRpc, models, tester } from '@hicommonwealth/model';
import { Community } from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import { expect } from 'chai';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import { z } from 'zod';
import { handleCommunityStakeTrades } from '../../src/policies/handlers/handleCommunityStakeTrades';

// These are all values for a real txn on the Ethereum Sepolia Testnet
const transactionHash =
  '0x4f4bbc83b94f99c266b5c4404f80492b4b5fff75ab89afad145d50c9040f8dfa';
const traderAddress = '0x47d3c3423803eB74eB9Ba0Fa3338DDb881A82081';
const namespaceAddress = '0x57853A35064A1746133D8635d343901b9d3f3959';
const isBuy = true;
const ethAmount = BigInt('242000000000000');
const stakeAmount = 1;
const stakeId = 2;
const blockTimestamp = 1712247912;

async function processValidStakeTransaction() {
  const context: EventContext<'CommunityStakeTrade'> = {
    name: 'CommunityStakeTrade',
    payload: {
      rawLog: {
        address: '0xf6C1B02257f0Ac4Af5a1FADd2dA8E37EC5f9E5fd',
        blockNumber: 5628559n,
        transactionHash,
        blockHash:
          '0xdf3b5cd44ea1a9f22a86f678b2e6d596238fe1d75b638cb5326415f293df32f5',
        transactionIndex: 0,
        logIndex: 0,
        removed: false,
        data: '0x',
        topics: [],
      },
      parsedArgs: {
        trader: traderAddress,
        namespace: namespaceAddress,
        isBuy,
        communityTokenAmount: 1n,
        ethAmount: 242000000000000n,
        protocolEthAmount: 18000000000n,
        nameSpaceEthAmount: 18000000000n,
        supply: 7n,
        exchangeToken: '0x0000000000000000000000000000000000000000',
      },
      eventSource: {
        ethChainId: cp.ValidChains.Sepolia,
      },
      block: {
        number: 5628559n,
        hash: '0x1',
        logsBloom: '0x1',
        nonce: '0x1',
        parentHash: '0x1',
        timestamp: 1673369600n,
        miner: '0x0000000000000000000000000000000000000000',
        gasLimit: 0n,
      },
    },
  };
  await handleCommunityStakeTrades(context);
}

describe('ChainEventCreated Policy', () => {
  let community: z.infer<typeof Community> | undefined;

  beforeAll(async () => {
    const [chainNode] = await tester.seed(
      'ChainNode',
      {
        url: createTestRpc(cp.ValidChains.Sepolia),
        private_url: createTestRpc(cp.ValidChains.Sepolia, 'private'),
        name: 'Sepolia Testnet',
        eth_chain_id: cp.ValidChains.Sepolia,
        balance_type: BalanceType.Ethereum,
      },
      { mock: false },
    );

    const [user] = await tester.seed('User', {
      isAdmin: true,
    });

    [community] = await tester.seed('Community', {
      chain_node_id: chainNode?.id,
      namespace_address: namespaceAddress,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
        },
      ],
      CommunityStakes: [
        {
          stake_id: stakeId,
          stake_token: '',
          vote_weight: 1,
          stake_enabled: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await models.StakeTransaction.truncate();
  });

  test("should save stake transactions that don't exist", async () => {
    await processValidStakeTransaction();
    const txns = await models.StakeTransaction.findAll();
    expect(txns.length).to.equal(1);
    expect(txns[0].toJSON()).to.deep.equal({
      transaction_hash: transactionHash,
      community_id: community!.id,
      stake_id: stakeId,
      address: traderAddress,
      stake_amount: stakeAmount,
      stake_price: ethAmount.toString(),
      stake_direction: isBuy ? 'buy' : 'sell',
      timestamp: blockTimestamp,
    });
  });

  test('should ignore stake transactions that already exist', async () => {
    await tester.seed('StakeTransaction', {
      transaction_hash: transactionHash,
      community_id: community!.id,
      stake_id: stakeId,
      address: traderAddress,
      stake_amount: stakeAmount,
      stake_price: ethAmount.toString(),
      stake_direction: isBuy ? 'buy' : 'sell',
      timestamp: blockTimestamp,
    });

    const initialCount = await models.StakeTransaction.count();
    expect(initialCount).to.equal(1);

    await processValidStakeTransaction();

    const postCount = await models.StakeTransaction.count();
    expect(postCount).to.equal(1);
  });
});
