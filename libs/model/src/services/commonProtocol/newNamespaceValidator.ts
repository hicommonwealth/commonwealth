import { AppError, ServerError } from '@hicommonwealth/core';
import {
  EvmEventSignatures,
  decodeParameters,
  factoryContracts,
  getNamespace,
  getTransactionReceipt,
  mustBeProtocolChainId,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { BalanceSourceType } from '@hicommonwealth/shared';
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
  community: { chain_node_id?: number | null },
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
  const { txReceipt } = await getTransactionReceipt({
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

  const addresses: string[] = [address];
  for (const contractAddresses of Object.values(factoryContracts)) {
    if ('tokenCommunityManager' in contractAddresses) {
      addresses.push(contractAddresses.tokenCommunityManager);
    }
  }

  // Validate User as admin
  const balance = await getBalances({
    balanceSourceType: BalanceSourceType.ERC1155,
    addresses,
    sourceOptions: {
      contractAddress: activeNamespace,
      evmChainId: chainNode.eth_chain_id,
      tokenId: 0,
    },
    cacheRefresh: true,
  });
  let adminMatch = false;
  for (const address of addresses) {
    if (balance[address] === '1') {
      adminMatch = true;
      break;
    }
  }
  if (!adminMatch) {
    throw new AppError('User not admin of namespace');
  }

  return activeNamespace;
};
