import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { communityStakesAbi } from './abi/CommunityStakesAbi';
import { namespaceFactoryAbi } from './abi/NamespaceFactoryAbi';
import dex_abi from './abi/dex';
import erc_1155_abi from './abi/erc1155';
import erc20_abi from './abi/erc20';
import erc_721_abi from './abi/erc721';

export const erc20 = (address: string, provider: Web3) => {
  return new provider.eth.Contract(erc20_abi as AbiItem[], address);
};

export const uniswapV2 = (address: string, provider: Web3) => {
  return new provider.eth.Contract(dex_abi as AbiItem[], address);
};

export const erc_721 = (address: string, provider: Web3) => {
  return new provider.eth.Contract(erc_721_abi as AbiItem[], address);
};

export const erc_1155 = (address: string, provider: Web3) => {
  return new provider.eth.Contract(erc_1155_abi as AbiItem[], address);
};

export const namespace_factory = (address: string, provider: Web3) => {
  return new provider.eth.Contract(namespaceFactoryAbi as AbiItem[], address);
};

export const community_stake = (address: string, provider: Web3) => {
  return new provider.eth.Contract(communityStakesAbi as AbiItem[], address);
};
