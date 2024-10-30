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
