import $ from 'jquery';
import app from 'state';
import m from 'mithril';
import { SearchParams } from '../views/components/search_bar';
import { modelFromServer } from '../controllers/server/threads';
import { OffchainThread } from '../models';

export const searchThreadTitles = async (
  searchTerm: string,
  params: SearchParams
): Promise<OffchainThread[]> => {
  const { resultSize, chainScope, communityScope } = params;
  try {
    const response = await $.get(`${app.serverUrl()}/search`, {
      chain: chainScope,
      community: communityScope,
      search: searchTerm,
      results_size: resultSize,
      thread_title_only: true,
    });
    if (response.status !== 'Success') {
      throw new Error(`Got unsuccessful status: ${response.status}`);
    }
    return response.result.map((rawThread) => {
      return modelFromServer(rawThread);
    });
  } catch (e) {
    console.error(e);
    return [];
  }
};

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
