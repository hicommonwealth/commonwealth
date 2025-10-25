import { getPublicClient, ValidChains } from '@hicommonwealth/evm-protocols';
import { ClaimTxStatus } from '@hicommonwealth/schemas';
import { models } from '../database';

export async function validateClaimTxnHash(
  txHash: `0x${string}`,
): Promise<{ status: ClaimTxStatus; at: Date | null }> {
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

  const [txn, receipt] = await Promise.all([
    client.getTransaction({ hash: txHash }),
    client.getTransactionReceipt({ hash: txHash }),
  ]);
  if (!txn || !receipt || !txn.blockNumber)
    return { status: 'PENDING', at: null };

  const block = await client.getBlock({ blockHash: txn.blockHash });
  return {
    status: receipt.status === 'reverted' ? 'FAILED' : 'CLAIMED',
    at: new Date(1000 * Number(block.timestamp)),
  };
}
