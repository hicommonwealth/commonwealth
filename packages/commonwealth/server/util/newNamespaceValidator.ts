import { DB } from 'server/models';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { AppError } from '../../../common-common/src/errors';
import { BalanceSourceType } from './requirementsModule/requirementsTypes';
import { TokenBalanceCache } from './tokenBalanceCache/tokenBalanceCache';

// Chains with deployed namespace factories. As new chains are enabled, add here.
export enum validChains {
  Goerli,
}

// Requires a live contract for each enum chain. Add address of factory here on new deploy.
const factoryContracts: {
  [key in validChains]: { factory: string; chainId: number };
} = {
  [validChains.Goerli]: {
    factory: '0xf877acdb66586ace7381b6e0b83697540f4c3871',
    chainId: 5,
  },
};
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
    return new AppError('tx failed');
  }
  if (txReceipt.from !== address) {
    return new AppError('Attested sender did not tx sender');
  }

  //validate contract data
  const factory = new web3.eth.Contract(
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
      name: 'getNamespace',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
    } as AbiItem,
    factoryData.factory,
  );

  const hexString = web3.utils.utf8ToHex(namespace);
  const activeNamespace = await factory.methods.getNamespace(hexString).call();
  if (activeNamespace !== txReceipt.contractAddress) {
    return new AppError('Invalid tx hash for namespace creation');
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
    return new AppError('User not admin of namespace');
  }
};
