import { AppError, ServerError } from '@hicommonwealth/core';
import {
  EvmEventSignatures,
  commonProtocol,
  decodeParameters,
  getNamespace,
  getTransactionReceipt,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { CommunityAttributes } from '../../models';
import { equalEvmAddresses } from '../../utils';
import { getBalances } from '../tokenBalanceCache';

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
  const factoryData =
    commonProtocol.factoryContracts[chain_id as commonProtocol.ValidChains];
  if (!factoryData) {
    throw new AppError('Namespace not supported on selected chain');
  }

  //tx data validation
  const txReceipt = await getTransactionReceipt({
    rpc: chainNode.private_url,
    txHash,
  });
  if (!txReceipt.status) {
    throw new AppError('tx failed');
  }
  if (txReceipt.from.toLowerCase() !== address.toLowerCase()) {
    throw new AppError('Attested sender did not tx sender');
  }

  //validate contract data
  const activeNamespace = await getNamespace(
    chainNode.private_url,
    namespace,
    factoryData.factory,
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
