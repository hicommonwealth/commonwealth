import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import erc20_abi from './abi/erc20';
import dex_abi from './abi/dex';
import comp_gov_abi from './abi/compGov';
import aave_gov_abi from './abi/aaveGov';

export const erc20 = (address: string, provider: Web3): Contract => {
  return new provider.eth.Contract(erc20_abi as AbiItem[], address);
};

export const uniswapV2 = (address: string, provider: Web3): Contract => {
  return new provider.eth.Contract(dex_abi as AbiItem[], address);
};

export const comp_gov = (address: string, provider: Web3): Contract => {
  return new provider.eth.Contract(comp_gov_abi as AbiItem[], address);
};

export const aave_gov = (address: string, provider: Web3): Contract => {
  return new provider.eth.Contract(aave_gov_abi as AbiItem[], address);
};
