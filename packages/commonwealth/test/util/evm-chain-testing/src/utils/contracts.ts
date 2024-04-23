import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import aave_gov_abi from './abi/aaveGov';
import comp_gov_abi from './abi/compGov';
import dex_abi from './abi/dex';
import erc_1155_abi from './abi/erc1155';
import erc20_abi from './abi/erc20';
import erc_721_abi from './abi/erc721';

export const erc20 = (address: string, provider: Web3): Contract<any> => {
  return new provider.eth.Contract(erc20_abi as AbiItem[], address);
};

export const uniswapV2 = (address: string, provider: Web3): Contract<any> => {
  return new provider.eth.Contract(dex_abi as AbiItem[], address);
};

export const comp_gov = (address: string, provider: Web3): Contract<any> => {
  return new provider.eth.Contract(comp_gov_abi as AbiItem[], address);
};

export const aave_gov = (address: string, provider: Web3): Contract<any> => {
  return new provider.eth.Contract(aave_gov_abi as AbiItem[], address);
};

export const erc_721 = (address: string, provider: Web3): Contract<any> => {
  return new provider.eth.Contract(erc_721_abi as AbiItem[], address);
};

export const erc_1155 = (address: string, provider: Web3): Contract<any> => {
  return new provider.eth.Contract(erc_1155_abi as AbiItem[], address);
};
