import $ from 'jquery';
import app from 'state';
import m from 'mithril';
import { SearchParams } from '../views/components/search_bar';

export const searchDiscussions = async (
  searchTerm: string,
  params: SearchParams
) => {
  const { resultSize, chainScope, communityScope } = params;
  try {
    const response = await $.get(`${app.serverUrl()}/search`, {
      chain: chainScope,
      community: communityScope,
      cutoff_date: null, // cutoffDate.toISOString(),
      search: searchTerm,
      results_size: resultSize,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const searchMentionableAddresses = async (
  searchTerm: string,
  params: SearchParams,
  order?: string[]
) => {
  const { resultSize, communityScope, chainScope } = params;
  try {
    const response = await $.get(`${app.serverUrl()}/bulkAddresses`, {
      chain: chainScope,
      community: communityScope,
      limit: resultSize,
      searchTerm,
      order,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const searchChainsAndCommunities = async (
  searchTerm?: string,
  limit?: number,
) => {
  try {
    const response = await $.get(`${app.serverUrl()}/getCommunitiesAndChains`, {
      searchTerm,
      limit,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result;
  } catch (e) {
    console.error(e);
    return [];
  }
};
