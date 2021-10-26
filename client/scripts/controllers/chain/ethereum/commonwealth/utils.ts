import $ from 'jquery';
import app from 'state';

export const kovanTokenData = [
  {
    name: 'WETH',
    symbol: 'WETH',
    address: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
    decimals: 18,
  },
  {
    name: 'USDC',
    symbol: 'USDC',
    address: '0xdcfab8057d08634279f8201b55d311c2a67897d2',
    decimals: 2,
  },
  {
    name: 'USDT',
    symbol: 'USDT',
    address: '0xf3e0d7bf58c5d455d31ef1c2d5375904df525105',
    decimals: 7,
  },
  {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    address: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
    decimals: 18,
  },
];

export interface ProjectMetaData {
  name: string;
  description: string;
  creator: string;
  beneficiary: string;
  acceptedTokens: string[];
  threshold: number;
  curatorFee: number;
  deadline: number;
}

export const EtherAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const getTokenDetails = async (tokens: string[]) => {
  const tokenAddresses = tokens.map((t) => t.toLowerCase());
  let tokensData = [];
  if (app.activeChainId()) {
    const res = await $.get(`${app.serverUrl()}/getTokenDetails`, {
      chain: app.activeChainId(),
      tokenAddresses,
    });
    if (res.status === 'Success') {
      tokensData = res.result.tokens || [];
    }
  }
  return tokensData;
};

export const getTokenHolders = async (tokenAddress: string) => {
  let tokenHolders = [];
  try {
    const COVALENTHQ_API_BASE_URL = 'https://api.covalenthq.com/v1';
    const CHAIN_ID = 42; // for kovan
    const apiUrl = `${COVALENTHQ_API_BASE_URL}/${CHAIN_ID}/tokens/${tokenAddress}/token_holders/`;
    const response = await $.get(apiUrl, {
      key: 'ckey_1bee39d2c56f46e4aada2380624',
      'page-number': 0,
      'page-size': 200,
    });
    if (!response.error) {
      const { items, pagination, updated_at } = response.data;
      tokenHolders = items.map((item: any) => {
        const newItem = {
          address: item.address,
          balance: item.balance,
        };
        return newItem;
      });
    }
  } catch (e) {
    console.log('====>failed to fetch token holders', e);
  }
  return tokenHolders;
};

export const needSync = (lastUpdatedAt?: Date) => {
  const syncPeriod = 5 * 60 * 1000; // update in every 5 mins
  if (!lastUpdatedAt) {
    return true;
  }
  return (
    Math.floor(
      Math.abs(new Date().getTime() - lastUpdatedAt.getTime()) / syncPeriod
    ) > 0
  );
};

export const protocolReady = () => {
  if (!app.chain || !app.cmnProtocol || !app.cmnProtocol.initialized)
    return false;
  if (app.activeChainId() !== app.cmnProtocol.chainId) return false;
  return true;
};

export const MAX_VALUE =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export interface CollectiveDataType {
  creator: string;
  beneficiary: string;
  acceptedTokens: string[];
  strategies: string[];
  name: string;
  description: string;
  ipfsHash: string;
}
