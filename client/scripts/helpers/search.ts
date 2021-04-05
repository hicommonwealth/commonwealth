import $ from 'jquery';
import app from 'state';

export const searchDiscussions = async (
  searchTerm: string,
  limit: number = 50
) => {
  console.log(app.activeChainId());
  console.log(app.activeCommunityId());
  const response = await $.get(`${app.serverUrl()}/search`, {
    chain: app.activeChainId(),
    community: app.activeCommunityId(),
    cutoff_date: null, // cutoffDate.toISOString(),
    search: searchTerm,
    results_size: limit,
  });
  if (response.status !== 'Success') {
    throw new Error(`Got unsuccessful status: ${response.status}`);
  }
  return response.result;
};

export const searchMentionableAddresses = async (
  searchTerm: string,
  limit: number = 6,
  order: string[] = ['name', 'ASC']
) => {
  const response = await $.get(`${app.serverUrl()}/bulkAddresses`, {
    chain: app.activeChainId(),
    limit,
    searchTerm,
    order,
  });
  if (response.status !== 'Success') {
    throw new Error(`Got unsuccessful status: ${response.status}`);
  }
  return response.result;
};

export const searchChainsAndCommunities = async (
  searchTerm: string,
  limit: number = 50,
) => {
  const response = await $.get(`${app.serverUrl()}/getCommunitiesAndChains`, {
    searchTerm,
    limit,
  });
  if (response.status !== 'Success') {
    throw new Error(`Got unsuccessful status: ${response.status}`);
  }
  return response.result;
};