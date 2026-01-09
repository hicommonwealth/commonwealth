import { SNAPSHOT_HUB_URL } from '@hicommonwealth/shared';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ApiEndpoints = {
  // endpoint builder functions like getEndpoint(id) => /endpoint/:id should have camel cased keys
  // stand alone endpoints should be have upper snake case keys so we can easily tell them apart in code
  FETCH_DOMAIN: '/domain',
  FETCH_PROPOSALS: '/proposals',
  FETCH_PROPOSAL_VOTES: '/proposalVotes',
  searchProfiles: (searchTerm: string) => `/profiles?search=${searchTerm}`,
  GENERATE_IMAGE: '/generateImage',
  GENERATE_TOKEN_IDEA: '/generateTokenIdea',
  UPLOAD_FILE: '/getUploadSignature',
};

export const ContractMethods = {
  GET_USER_STAKE_BALANCE: 'getUserStakeBalance',
  GET_USER_ETH_BALANCE: 'getUserEthBalance',
  GET_BUY_PRICE: 'getBuyPrice',
  GET_SELL_PRICE: 'getSellPrice',
  GET_CONTEST_BALANCE: 'getContestBalance',
  GET_FEE_MANAGER_BALANCE: 'getFeeManagerBalance',
};

// keys that are not (yet) associated with API routes
export const QueryKeys = {
  CONFIGURATION: 'configuration',
};

export const ExternalEndpoints = {
  coinbase: {
    tokenToUsdRate: (tokenSymbol: string) =>
      `https://api.coinbase.com/v2/prices/${tokenSymbol}-USD/sell`,
  },
  defiLlama: {
    tokenToUsdRate: (tokenContractAddress: string) =>
      `https://coins.llama.fi/prices/current/base:${tokenContractAddress}`,
  },
  snapshotHub: {
    url: SNAPSHOT_HUB_URL,
    graphql: SNAPSHOT_HUB_URL + '/graphql',
  },
  kalshi: {
    baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
    events: 'https://api.elections.kalshi.com/trade-api/v2/events',
  },
  polymarket: {
    baseUrl: 'https://gamma-api.polymarket.com',
    markets: 'https://gamma-api.polymarket.com/markets',
  },
};

export const SERVER_URL = '/api';
