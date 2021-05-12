import { INewChainInfo, TokenResponse } from '../../shared/types';
import { slugify } from '../../shared/utils';
import { ChainInstance } from '../models/chain';
import TokenBalanceCache from './tokenBalanceCache';

const checkNewChainInfoWithTokenList = async (
  tokenBalanceCache: TokenBalanceCache,
  newChainInfo: INewChainInfo,
): Promise<TokenResponse> => {
  const tokens = await tokenBalanceCache.getTokens();
  if (!newChainInfo.symbol) throw new Error('Missing symbol');
  if (!newChainInfo.name) throw new Error('Missing name');
  if (!newChainInfo.address) throw new Error('Missing address');

  const token = tokens.find((o) => o.name === newChainInfo.name
    && o.symbol === newChainInfo.symbol
    && o.address === newChainInfo.address);
  return token;
};

export const createChainForThread = async (
  models,
  tokenBalanceCache: TokenBalanceCache,
  newChainInfo: INewChainInfo
): Promise<[ChainInstance | null, Error | null]> => {
  try {
    const foundInList = await checkNewChainInfoWithTokenList(tokenBalanceCache, newChainInfo);
    if (!foundInList) {
      throw new Error('New chain not found in token list');
    }

    const createdId = slugify(foundInList.name);

    const chainContent = {
      id: createdId,
      active: true,
      network: createdId,
      type: 'token',
      icon_url: foundInList.logoURI,
      symbol: foundInList.symbol,
      name: foundInList.name,
      default_chain: 'ethereum',
      base: 'ethereum',
    };

    const chainNodeContent = {
      chain: createdId,
      url: 'wss://mainnet.infura.io/ws',
      address: foundInList.address
    };
    const chain = await models.Chain.create(chainContent);
    await models.ChainNode.create(chainNodeContent);

    return [chain, null];
  } catch (e) {
    return [null, e];
  }
};

export const createChainForAddress = async (
  models,
  tokenBalanceCache: TokenBalanceCache,
  newChainInfo: INewChainInfo
): Promise<[ChainInstance | null, Error | null]> => {
  try {
    const foundInList = await checkNewChainInfoWithTokenList(tokenBalanceCache, newChainInfo);
    if (!foundInList) {
      throw new Error('New chain not found in token list');
    }

    const createdId = slugify(foundInList.name);

    const chainContent = {
      id: createdId,
      active: true,
      network: createdId,
      type: 'token',
      icon_url: foundInList.logoURI,
      symbol: foundInList.symbol,
      name: foundInList.name,
      default_chain: 'ethereum',
      base: 'ethereum',
    };

    const chainNodeContent = {
      chain: createdId,
      url: 'wss://mainnet.infura.io/ws',
      address: foundInList.address
    };
    const chain = await models.Chain.create(chainContent);
    await models.ChainNode.create(chainNodeContent);

    return [chain, null];
  } catch (e) {
    return [null, e];
  }
};
