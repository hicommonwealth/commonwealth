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
  BULK_TOPICS: '/topics',
  FETCH_ADMIN: '/roles',
  FETCH_COMMUNITY_STAKES: '/communityStakes',
  FETCH_COMMENTS: '/viewComments',
  FETCH_RELATED_COMMUNITIES: '/relatedCommunities',
  FETCH_ACTIVE_COMMUNITIES: '/communities',
  FETCH_THREADS: '/threads',
  FETCH_PROFILES_BY_ADDRESS: '/getAddressProfile',
  FETCH_PROFILES_BY_ID: '/profile/v2',
  FETCH_NODES: '/nodes',
  DISCORD_CHANNELS: '/getDiscordChannels',
  SET_DISCORD_CONFIG: '/setDiscordBotConfig',
  FETCH_PROPOSALS: '/proposals',
  FETCH_PROPOSAL_VOTES: '/proposalVotes',
  FETCH_GROUPS: '/groups',
  REFRESH_MEMBERSHIP: '/refresh-membership',
  FETCH_WEBHOOKS: '/getWebhooks',
  FETCH_TAGS: '/tags',
  UPDATE_USER_EMAIL: '/updateEmail',
  UPDATE_USER_EMAIL_INTERVAL_SETTINGS: '/writeUserSetting',
  UPDATE_USER_ACTIVE_COMMUNTY: '/selectCommunity',
  searchThreads: (searchTerm: string) => `/threads?search=${searchTerm}`,
  searchComments: (searchTerm: string) => `/comments?search=${searchTerm}`,
  searchProfiles: (searchTerm: string) => `/profiles?search=${searchTerm}`,
  searchChains: (searchTerm: string) => `/communities?search=${searchTerm}`,
  REMOVE_DISCORD_BOT_CONFIG: '/removeDiscordBotConfig',
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
};
