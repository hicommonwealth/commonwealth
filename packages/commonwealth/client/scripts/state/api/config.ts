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
  FETCH_COMMENTS: '/viewComments',
  FETCH_THREADS: '/threads',
  FETCH_PROFILES: '/getAddressProfile',
  DISCORD_CHANNELS: '/getDiscordChannels',
  FETCH_PROPOSALS: '/proposals',
  FETCH_PROPOSAL_VOTES: '/proposalVotes',
  searchThreads: (searchTerm: string) => `/threads?search=${searchTerm}`,
  searchComments: (searchTerm: string) => `/comments?search=${searchTerm}`,
  searchProfiles: (searchTerm: string) => `/profiles?search=${searchTerm}`,
  searchChains: (searchTerm: string) => `/communities?search=${searchTerm}`,
};
