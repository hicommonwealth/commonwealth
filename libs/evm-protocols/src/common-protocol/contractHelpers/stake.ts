import {
  arbitraryEvmCall,
  decodeParameters,
  getBlock,
  getTransactionReceipt,
} from '@hicommonwealth/evm-protocols';
import Web3, { AbiFunctionFragment } from 'web3';
import { ValidChains, factoryContracts } from '../chainConfig';

export const checkCommunityStakeWhitelist = async ({
  eth_chain_id,
  rpc,
  namespace_address,
  stake_id,
}: {
  eth_chain_id: ValidChains;
  rpc: string;
  namespace_address: string;
  stake_id: number;
}): Promise<boolean> => {
  const web3 = new Web3(rpc);

  const abiItem = {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'whitelist',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
  } as AbiFunctionFragment;

  const calldata = web3.eth.abi.encodeFunctionCall(abiItem, [
    namespace_address,
    stake_id,
  ]);
  const whitelistResponse = await web3.eth.call({
    to: factoryContracts[eth_chain_id].communityStake,
    data: calldata,
  });
  return !!web3.eth.abi.decodeParameter('bool', whitelistResponse);
};

export const getStakeTradeInfo = async ({
  rpc,
  txHash,
  blockHash,
}: {
  rpc: string;
  txHash: string;
  blockHash: string;
}) => {
  const [{ txReceipt: tradeTxReceipt }, { block }] = await Promise.all([
    getTransactionReceipt({
      rpc,
      txHash,
    }),
    getBlock({
      rpc,
      blockHash,
    }),
  ]);

  const { 0: stakeId, 1: stakeAmount } = decodeParameters({
    abiInput: ['uint256', 'uint256'],
    data: String(tradeTxReceipt.logs[0].data),
  });

  return {
    stakeId: parseInt(stakeId as string),
    stakeAmount: parseInt(stakeAmount as string),
    timestamp: Number(block.timestamp),
  };
};

export const getAndVerifyStakeTrade = async ({
  ethChainId,
  rpc,
  txHash,
  namespace,
}: {
  ethChainId: ValidChains;
  rpc: string;
  txHash: string;
  namespace: string;
}): Promise<{
  stakeId: number;
  value: number;
  ethAmount: string;
  traderAddress: string;
  stakeDirection: 'buy' | 'sell';
  timestamp: number;
}> => {
  const communityStakeAddress = factoryContracts[ethChainId].communityStake;

  const { evmClient, txReceipt } = await getTransactionReceipt({
    rpc,
    txHash,
  });
  const { block } = await getBlock({
    rpc,
    blockHash: txReceipt.blockHash.toString(),
  });
  const timestamp: number = Number(block.timestamp);

  if (
    ![txReceipt.from, txReceipt.to].includes(
      communityStakeAddress.toLowerCase(),
    )
  ) {
    throw new Error(
      'This transaction is not associated with a community stake',
    );
  }
  if (
    !txReceipt.logs[0].data ||
    !txReceipt.logs[0].address ||
    !txReceipt.logs[1].data
  ) {
    throw new Error('No logs returned from transaction');
  }
  const { 0: stakeId, 1: value } = decodeParameters({
    abiInput: ['uint256', 'uint256'],
    data: txReceipt.logs[0].data.toString(),
  });

  const response = await arbitraryEvmCall({
    evmClient,
    rpc,
    to: txReceipt.logs[0].address, // src of Transfer single
    data: '0x06fdde03', // name function selector
  });
  const { 0: name } = decodeParameters({
    abiInput: ['string'],
    data: response,
  });
  if (name !== namespace) {
    throw new Error('Transaction is not associated with provided community');
  }

  const {
    0: trader,
    // 1: namespace,
    2: isBuy,
    // 3: communityTokenAmount,
    4: ethAmount,
    // 5: protocolEthAmount,
    // 6: nameSpaceEthAmount,
  } = decodeParameters({
    abiInput: [
      'address',
      'address',
      'bool',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
    ],
    data: txReceipt.logs[1].data.toString(),
  });

  return {
    stakeId: Number(stakeId),
    value: Number(value),
    ethAmount: Number(ethAmount).toString(),
    traderAddress: String(trader),
    stakeDirection: isBuy ? 'buy' : 'sell',
    timestamp,
  };
};
