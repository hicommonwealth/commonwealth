import { QueryClient } from '@tanstack/react-query';
import process from 'process';

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
  BULK_TOPICS: '/topics',
  FETCH_ADMIN: '/roles',
  FETCH_COMMUNITY_STAKES: '/communityStakes',
  FETCH_COMMENTS: '/viewComments',
  FETCH_RELATED_COMMUNITIES: '/relatedCommunities',
  FETCH_THREADS: '/threads',
  FETCH_PROFILES_BY_ADDRESS: '/getAddressProfile',
  FETCH_PROFILES_BY_ID: '/profile/v2',
  FETCH_NODES: '/nodes',
  FETCH_DOMAIN: '/domain',
  FETCH_PROPOSALS: '/proposals',
  FETCH_PROPOSAL_VOTES: '/proposalVotes',
  FETCH_GROUPS: '/groups',
  REFRESH_MEMBERSHIP: '/refresh-membership',
  FETCH_TAGS: '/tags',
  UPDATE_USER_EMAIL: '/updateEmail',
  UPDATE_USER_EMAIL_INTERVAL_SETTINGS: '/writeUserSetting',
  UPDATE_USER_ACTIVE_COMMUNTY: '/selectCommunity',
  fetchThreadPolls: (threadId: number) => `/threads/${threadId}/polls`,
  searchThreads: (searchTerm: string) => `/threads?search=${searchTerm}`,
  searchComments: (searchTerm: string) => `/comments?search=${searchTerm}`,
  searchProfiles: (searchTerm: string) => `/profiles?search=${searchTerm}`,
  searchChains: (searchTerm: string) => `/communities?search=${searchTerm}`,
  VIEW_COUNT: '/viewCount',
  FETCH_USER_ACTIVITY: '/viewUserActivity',
  FETCH_GLOBAL_ACTIVITY: '/viewGlobalActivity',
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
    ethToUsdRate: 'https://api.coinbase.com/v2/prices/ETH-USD/sell',
  },
  snapshotHub: {
    url: process.env.SNAPSHOT_HUB_URL || 'https://hub.snapshot.org',
    graphql: process.env.SNAPSHOT_HUB_URL
      ? process.env.SNAPSHOT_HUB_URL + '/graphql'
      : 'https://hub.snapshot.org/graphql',
  },
};

export const SERVER_URL = '/api';
