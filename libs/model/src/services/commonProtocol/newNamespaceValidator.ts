import { AppError, ServerError } from '@hicommonwealth/core';
import {
  EvmEventSignatures,
  decodeParameters,
  getNamespace,
  getTransactionReceipt,
  mustBeProtocolChainId,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { CommunityAttributes } from '../../models';
import { equalEvmAddresses } from '../../utils';
import { getBalances } from '../tokenBalanceCache';

/**
 * Helper function to implement retry logic for getTransactionReceipt with exponential backoff
 */
const getTransactionReceiptWithRetry = async (params: {
  rpc: string;
  txHash: string;
  maxRetries?: number;
  initialDelay?: number;
}) => {
  const { rpc, txHash, maxRetries = 3, initialDelay = 1000 } = params;
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      return await getTransactionReceipt({ rpc, txHash });
    } catch (error) {
      console.log('getTransactionReceiptWithRetry ERR: ', error);
      if (retries < maxRetries) {
        retries++;
        // Exponential backoff with base 2: 1s, 2s, 4s, 8s, etc
        const backoffDelay = initialDelay * Math.pow(2, retries - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        continue;
      }
      throw error;
    }
  }

  // This should never be reached due to the logic in the catch block,
  // but TypeScript requires a return value for all code paths
  throw new Error('Maximum retries reached');
};

/**
 * Validate if an attested new namespace is valid on-chain Checks:
 * 1. Tx success
 * 2. sender validity
 * 3. correct contract address
 * 4. If user is the admin of namespace on-chain
 * @param model
 * @param namespace The namespace name
 * @param txHash transaction hash of creation tx
 * @param address user's address
 * @param community the community
 * @returns an AppError if any validations fail, else passses
 */
export const validateNamespace = async (
  namespace: string,
  txHash: string,
  address: string,
  community: CommunityAttributes,
): Promise<string> => {
  if (!community.chain_node_id) {
    throw new AppError('Invalid community');
  }

  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      id: community.chain_node_id,
    },
  });

  if (!chainNode) {
    throw new AppError('Invalid chain');
  }

  if (!chainNode.eth_chain_id) {
    throw new AppError('Namespace not supported on selected chain');
  }

  if (!chainNode.private_url) {
    throw new ServerError(
      `Chain Node private url not found for chain node id ${chainNode.id}`,
    );
  }

  const chain_id = chainNode.eth_chain_id;
  mustBeProtocolChainId(chain_id);

  //tx data validation
  const { txReceipt } = await getTransactionReceiptWithRetry({
    rpc: chainNode.private_url,
    txHash,
    maxRetries: 5,
    initialDelay: 1000,
  });
  if (!txReceipt.status) {
    throw new AppError('tx failed');
  }
  if (txReceipt.from.toLowerCase() !== address.toLowerCase()) {
    throw new AppError('Attested sender did not tx sender');
  }

  //validate contract data
  const activeNamespace = await getNamespace(
    { rpc: chainNode.private_url, eth_chain_id: chain_id },
    namespace,
  );

  let namespaceAddress: string | undefined;

  // only emitted in token launch flows (launchpad)
  const communityNamespaceCreatedLog = txReceipt.logs.find((l) => {
    if (l.topics && l.topics.length > 0) {
      return (
        l.topics[0].toString() ===
        EvmEventSignatures.NamespaceFactory.CommunityNamespaceCreated
      );
    }
    return false;
  });
  if (communityNamespaceCreatedLog) {
    const { 0: _namespaceAddress } = decodeParameters({
      abiInput: ['address', 'address'],
      data: communityNamespaceCreatedLog.data!.toString(),
    });
    namespaceAddress = _namespaceAddress as string;
  } else {
    // default namespace deployment tx
    namespaceAddress = txReceipt.logs[0].address;
  }

  if (!equalEvmAddresses(activeNamespace, namespaceAddress)) {
    throw new AppError('Invalid tx hash for namespace creation');
  }

  // Validate User as admin
  const balance = await getBalances({
    balanceSourceType: BalanceSourceType.ERC1155,
    addresses: [address],
    sourceOptions: {
      contractAddress: activeNamespace,
      evmChainId: chainNode.eth_chain_id,
      tokenId: 0,
    },
    cacheRefresh: true,
  });
  if (balance[address] !== '1') {
    throw new AppError('User not admin of namespace');
  }

  return activeNamespace;
};
