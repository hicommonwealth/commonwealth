import { BalanceType, EventContext, dispose } from '@hicommonwealth/core';
import { DB, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { seed } from '../../../../../libs/model/src/tester';
// eslint-disable-next-line max-len
import { processChainEventCreated } from '../../../server/workers/commonwealthConsumer/policies/chainEventCreated/chainEventCreatedPolicy';

// These are all values for a real txn on the Ethereum Sepolia Testnet
const transactionHash =
  '0x4f4bbc83b94f99c266b5c4404f80492b4b5fff75ab89afad145d50c9040f8dfa';
const traderAddress = '0x47d3c3423803eB74eB9Ba0Fa3338DDb881A82081';
const namespaceAddress = '0x57853A35064A1746133D8635d343901b9d3f3959';
const isBuy = true;
const ethAmount = BigNumber.from('242000000000000');
const stakeAmount = 1;
const stakeId = 2;
const blockTimestamp = 1712247912;

async function processValidStakeTransaction(chainNodeId) {
  const context: EventContext<'ChainEventCreated'> = {
    name: 'ChainEventCreated',
    payload: {
      rawLog: {
        address: '0xf6C1B02257f0Ac4Af5a1FADd2dA8E37EC5f9E5fd',
        blockNumber: 5628559,
        transactionHash,
        blockHash:
          '0xdf3b5cd44ea1a9f22a86f678b2e6d596238fe1d75b638cb5326415f293df32f5',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      parsedArgs: [
        traderAddress,
        namespaceAddress,
        isBuy,
        {
          hex: '0x01',
          type: 'BigNumber',
        },
        ethAmount.toJSON(),
        {
          hex: '0x0430e23400',
          type: 'BigNumber',
        },
        { hex: '0x0430e23400', type: 'BigNumber' },
        {
          hex: '0x07',
          type: 'BigNumber',
        },
        '0x0000000000000000000000000000000000000000',
      ],
      eventSource: { kind: 'Trade', chainNodeId },
    },
  };
  await processChainEventCreated(context);
}

describe.only('ChainEventCreated Policy', () => {
  let models: DB;
  let chainNode, community;

  before(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    [chainNode] = await tester.seed(
      'ChainNode',
      {
        url: 'https://ethereum-sepolia.publicnode.com',
        name: 'Sepolia Testnet',
        eth_chain_id: 11155111,
        balance_type: BalanceType.Ethereum,
        contracts: [],
      },
      { mock: false },
    );

    const [user] = await seed('User', {
      isAdmin: true,
      selected_community_id: null,
    });

    [community] = await tester.seed('Community', {
      chain_node_id: chainNode?.id,
      namespace_address: namespaceAddress,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
          profile_id: undefined,
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
      topics: [],
      groups: [],
      discord_config_id: null,
    });
  });

  after(async () => {
    await dispose()();
  });

  afterEach('Clear Stake Transactions', async () => {
    await models.StakeTransaction.truncate();
  });

  it("should save stake transactions that don't exist", async () => {
    await processValidStakeTransaction(chainNode.id);
    const txns = await models.StakeTransaction.findAll();
    expect(txns.length).to.equal(1);
    expect(txns[0].toJSON()).to.deep.equal({
      transaction_hash: transactionHash,
      community_id: community.id,
      stake_id: stakeId,
      address: traderAddress,
      stake_amount: stakeAmount,
      stake_price: ethAmount.toString(),
      stake_direction: isBuy ? 'buy' : 'sell',
      timestamp: blockTimestamp,
    });
  });

  it('should ignore stake transactions that already exist', async () => {
    await seed('StakeTransaction', {
      transaction_hash: transactionHash,
      community_id: community.id,
      stake_id: stakeId,
      address: traderAddress,
      stake_amount: stakeAmount,
      stake_price: ethAmount.toString(),
      stake_direction: isBuy ? 'buy' : 'sell',
      timestamp: blockTimestamp,
    });

    const initialCount = await models.StakeTransaction.count();
    expect(initialCount).to.equal(1);

    await processValidStakeTransaction(chainNode.id);

    const postCount = await models.StakeTransaction.count();
    expect(postCount).to.equal(1);
  });
});
