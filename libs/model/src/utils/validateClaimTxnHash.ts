import { InvalidInput } from '@hicommonwealth/core';
import { getPublicClient, ValidChains } from '@hicommonwealth/evm-protocols';
import { models } from '../database';

export async function validateClaimTxnHash(txHash: `0x${string}`) {
  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      eth_chain_id: ValidChains.Base,
    },
  });
  if (!chainNode) {
    throw new Error('Base chain node not found!');
  }

  const client = getPublicClient({
    rpc: chainNode.private_url!,
    eth_chain_id: ValidChains.Base,
  });

  const txn = await client.getTransaction({
    hash: txHash,
  });
  if (!txn || !txn.blockNumber) {
    throw new InvalidInput('Transaction does not exist on-chain');
  }

  const block = await client.getBlock({
    blockHash: txn.blockHash,
  });

  return new Date(1000 * Number(block.timestamp));
}
