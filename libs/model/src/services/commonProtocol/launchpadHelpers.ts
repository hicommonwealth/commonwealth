import { commonProtocol } from '@hicommonwealth/shared';
import Web3 from 'web3';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import { tokenCommunityManagerAbi } from './abi/TokenCommunityManager';
import { erc20Abi } from './abi/erc20';

export async function createTokenHandler(
  chainNodeId: number,
  tokenAddress: string,
  description?: string,
  iconUrl?: string,
) {
  const chainNode = await models.ChainNode.findOne({
    where: { id: chainNodeId },
    attributes: ['eth_chain_id', 'url', 'private_url'],
  });

  mustExist('Chain Node', chainNode);

  const web3 = new Web3(chainNode.private_url || chainNode.url);

  const contracts =
    commonProtocol.factoryContracts[
      chainNode.eth_chain_id as commonProtocol.ValidChains
    ];
  const tokenManagerAddress = contracts.tokenCommunityManager;
  const tokenManagerContract = new web3.eth.Contract(
    tokenCommunityManagerAbi,
    tokenManagerAddress,
  );

  let namespace: string;
  try {
    namespace = await tokenManagerContract.methods
      .namespaceForToken(tokenAddress)
      .call();
  } catch (error) {
    throw Error(`Failed to get namespace for token ${tokenAddress}`);
  }

  const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);

  let name: string;
  let symbol: string;
  let totalSupply: bigint;

  try {
    name = await erc20Contract.methods.name().call();
    symbol = await erc20Contract.methods.symbol().call();
    totalSupply = await erc20Contract.methods.totalSupply().call();
  } catch (e) {
    throw Error(
      `Failed to get erc20 token properties for token ${tokenAddress}`,
    );
  }

  const token = await models.Token.create({
    token_address: tokenAddress,
    namespace,
    name,
    symbol,
    initial_supply: totalSupply,
    is_locked: false,
    description: description ?? null,
    icon_url: iconUrl ?? null,
  });

  return token!.toJSON();
}

export async function transactionHashToTokenAddress(
  transactionHash: string,
  chain_node_id: number,
) {
  const chainNode = await models.ChainNode.findOne({
    where: { id: chain_node_id },
    attributes: ['eth_chain_id', 'url', 'private_url'],
  });

  mustExist('Chain Node', chainNode);

  const web3 = new Web3(chainNode.private_url || chainNode.url);

  const txReceipt = await web3.eth.getTransactionReceipt(transactionHash);
  const tokenAddress = txReceipt.logs[0].address!;
  if (!tokenAddress) {
    throw Error(
      'Failed to find tokenAddress is token creation command. Review tokenAddress logic',
    );
  }

  return tokenAddress;
}

export async function getLaunchpadTradeTransaction({
  rpc,
  transactionHash,
}: {
  rpc: string;
  transactionHash: string;
}) {
  const web3 = new Web3(rpc);

  const txReceipt = await web3.eth.getTransactionReceipt(transactionHash);
  if (!txReceipt) {
    return;
  }

  const block = await web3.eth.getBlock(txReceipt.blockHash.toString());

  const {
    0: traderAddress,
    1: tokenAddress,
    2: isBuy,
    3: communityTokenAmount,
    4: ethAmount,
    5: protocolEthAmount,
    6: floatingSupply,
  } = web3.eth.abi.decodeParameters(
    ['address', 'address', 'bool', 'uint256', 'uint256', 'uint256', 'uint256'],
    txReceipt.logs[1].data!.toString(),
  );

  return {
    txReceipt,
    block,
    parsedArgs: {
      traderAddress: traderAddress as string,
      tokenAddress: tokenAddress as string,
      isBuy: isBuy as boolean,
      communityTokenAmount: communityTokenAmount as bigint,
      ethAmount: ethAmount as bigint,
      protocolEthAmount: protocolEthAmount as bigint,
      floatingSupply: floatingSupply as bigint,
    },
  };
}
