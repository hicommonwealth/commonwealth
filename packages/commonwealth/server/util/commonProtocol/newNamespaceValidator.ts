import { DB } from 'server/models';
import Web3 from 'web3';
import { AppError } from '../../../../common-common/src/errors';
import { BalanceSourceType } from '../requirementsModule/requirementsTypes';
import { TokenBalanceCache } from '../tokenBalanceCache/tokenBalanceCache';
import { factoryContracts, validChains } from './chainConfig';
import { getNamespace } from './contractHelpers';

/**
 * Validate if an attested new namespace is valid on-chain Checks:
 * 1. Tx success
 * 2. sender validity
 * 3. correct contract address
 * 4. If user is the admin of namespace on-chain
 * @param model
 * @param tbc
 * @param namespace The namespace name
 * @param txHash transaction hash of creation tx
 * @param address user's address
 * @param chain Select a chain from the validChains enum
 * @returns an AppError if any validations fail, else passses
 */
export const validateNamespace = async (
  model: DB,
  tbc: TokenBalanceCache,
  namespace: string,
  txHash: string,
  address: string,
  chain: validChains,
) => {
  const factoryData = factoryContracts[chain];
  const node = await model.ChainNode.findOne({
    where: {
      eth_chain_id: factoryData.chainId,
    },
    attributes: ['url'],
  });
  const web3 = new Web3(node.url);

  //tx data validation
  const txReceipt = await web3.eth.getTransactionReceipt(txHash);
  if (!txReceipt.status) {
    throw new AppError('tx failed');
  }
  if (txReceipt.from.toLowerCase() !== address.toLowerCase()) {
    throw new AppError('Attested sender did not tx sender');
  }

  //validate contract data
  const activeNamespace = await getNamespace(
    web3,
    namespace,
    factoryData.factory,
  );

  if (activeNamespace !== txReceipt.logs[0].address) {
    throw new AppError('Invalid tx hash for namespace creation');
  }

  // Validate User as admin
  const balance = await tbc.getBalances({
    balanceSourceType: BalanceSourceType.ERC1155,
    addresses: [address],
    sourceOptions: {
      contractAddress: activeNamespace,
      evmChainId: factoryData.chainId,
      tokenId: 0,
    },
    cacheRefresh: true,
  });
  if (balance[address] !== '1') {
    throw new AppError('User not admin of namespace');
  }
};
