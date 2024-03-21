import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import {
  factoryContracts,
  ValidChains,
} from '@hicommonwealth/core/build/commonProtocol/index';
import Web3 from 'web3';
import { models } from '../database';

export const CreateStakeTransaction: Command<
  typeof schemas.commands.CreateStakeTransaction
> = () => ({
  ...schemas.commands.CreateStakeTransaction,
  auth: [],
  body: async ({ payload }) => {
    const community = await models.Community.findOne({
      where: { id: payload.community_id },
      include: [
        {
          model: models.ChainNode,
          attributes: ['eth_chain_id', 'url'],
        },
      ],
    });

    if (!community || !community.id || !community.ChainNode) {
      throw Error(`${community ? 'Community' : 'ChainNode'} not found`);
    }

    if (
      !Object.values(ValidChains).includes(community.ChainNode.eth_chain_id!)
    ) {
      throw Error('Chain does not have deployed namespace factory');
    }

    const web3 = new Web3('https://ethereum-sepolia.publicnode.com');

    const [transaction, txReceipt] = await Promise.all([
      web3.eth.getTransaction(payload.transaction_hash),
      web3.eth.getTransactionReceipt(payload.transaction_hash),
    ]);
    const timestamp: number = (
      await web3.eth.getBlock(transaction.blockHash as string)
    ).timestamp as number;

    let direction: 'buy' | 'sell', address: string;
    const communityStakeAddress: string =
      factoryContracts[community.ChainNode.eth_chain_id as ValidChains]
        .communityStake;
    if (transaction.to === communityStakeAddress) {
      direction = 'buy';
      address = transaction.from;
    } else if (transaction.from === communityStakeAddress) {
      direction = 'sell';
      address = transaction.to!;
    } else {
      throw new Error(
        'This transaction is not associated with a community stake',
      );
    }

    const data = web3.eth.abi.decodeParameters(
      ['uint256', 'uint256'],
      txReceipt.logs[0].data,
    );

    const stakeAggregate = await models.StakeTransaction.create({
      transaction_hash: payload.transaction_hash,
      community_id: community.id,
      stake_id: parseInt(data[0]),
      stake_amount: parseInt(data[1]),
      stake_price: transaction.value,
      address,
      stake_direction: direction,
      timestamp,
    });

    return stakeAggregate?.get({ plain: true });
  },
});
