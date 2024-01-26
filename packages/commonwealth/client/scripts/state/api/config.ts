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
  FETCH_THREADS: '/threads',
  FETCH_PROFILES: '/getAddressProfile',
  DISCORD_CHANNELS: '/getDiscordChannels',
  FETCH_PROPOSALS: '/proposals',
  FETCH_PROPOSAL_VOTES: '/proposalVotes',
  FETCH_GROUPS: '/groups',
  REFRESH_MEMBERSHIP: '/refresh-membership',
  FETCH_WEBHOOKS: '/getWebhooks',
  searchThreads: (searchTerm: string) => `/threads?search=${searchTerm}`,
  searchComments: (searchTerm: string) => `/comments?search=${searchTerm}`,
  searchProfiles: (searchTerm: string) => `/profiles?search=${searchTerm}`,
  searchChains: (searchTerm: string) => `/communities?search=${searchTerm}`,
};
