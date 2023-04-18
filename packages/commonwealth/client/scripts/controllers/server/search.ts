import $ from 'jquery';
import moment from 'moment';
import app from 'state';
import SearchStore from 'stores/SearchStore';
import { SearchContentType } from 'types';
import type { Thread } from '../../models';
import { SearchQuery } from '../../models';
import type { SearchParams } from '../../models/SearchQuery';
import { SearchScope } from '../../models/SearchQuery';

export enum SearchTab {
  Threads = 'Threads',
  Replies = 'Replies',
  Communities = 'Communities',
  Members = 'Members',
}

const SEARCH_PREVIEW_SIZE = 6;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query
const SEARCH_HISTORY_KEY = 'COMMONWEALTH_SEARCH_HISTORY';
const SEARCH_HISTORY_SIZE = 10;

class SearchController {
  private _store: SearchStore = new SearchStore();

  public store() {
    return this._store;
  }

  public getByQuery(query: SearchQuery) {
    if (query.searchTerm.length > 3) {
      return this._store.getByQueryString(query.toEncodedString());
    }
    return null;
  }

  public async search(searchQuery: SearchQuery) {
    if (this.getByQuery(searchQuery)?.loaded) {
      return this.getByQuery(searchQuery);
    }
    const searchCache = this._store.getOrAdd(searchQuery);
    const { searchTerm, chainScope, isSearchPreview, sort } = searchQuery;
    const resultSize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;
    const scope = searchQuery.getSearchScope();

    try {
      if (
        scope.includes(SearchScope.Threads) ||
        scope.includes(SearchScope.Proposals)
      ) {
        const discussions = await this.searchDiscussions(searchTerm, {
          resultSize,
          chainScope,
          sort,
        });

        searchCache.results[SearchScope.Threads] = discussions.map(
          (discussion) => {
            discussion.SearchContentType = SearchContentType.Thread;
            discussion.searchType = SearchScope.Threads;
            return discussion;
          }
        );
      }

      if (scope.includes(SearchScope.Replies)) {
        const comments = await this.searchComments(searchTerm, {
          resultSize,
          chainScope,
        });

        searchCache.results[SearchScope.Replies] = comments.map((comment) => {
          comment.SearchContentType = SearchContentType.Comment;
          comment.searchType = SearchScope.Replies;
          return comment;
        });
      }

      if (scope.includes(SearchScope.Communities)) {
        const allComms = app.config.chains.getAll() as any;
        const filteredComms = allComms.filter((comm) => {
          return (
            comm.name?.toLowerCase().includes(searchTerm) ||
            comm.symbol?.toLowerCase().includes(searchTerm)
          );
        });

        searchCache.results[SearchScope.Communities] = filteredComms
          .map((chain) => {
            chain.SearchContentType = SearchContentType.Chain;
            chain.searchType = SearchScope.Communities;
            return chain;
          })
          .sort(this.sortCommunities);
      }

      if (scope.includes(SearchScope.Members)) {
        const addrs = await this.searchMentionableAddresses(
          searchTerm,
          { resultSize, chainScope },
          ['created_at', 'DESC']
        );

        searchCache.results[SearchScope.Members] = addrs
          .map((addr) => {
            addr.SearchContentType = SearchContentType.Member;
            addr.searchType = SearchScope.Members;
            return addr;
          })
          .sort(this.sortResults);
      }
    } finally {
      searchCache.loaded = true;
      this._store.update(searchCache);
    }
    return searchCache;
  }

  public async searchPaginated(
    searchTerm: string,
    tab: SearchTab,
    page?: number
  ) {
    return this.searchDiscussions(searchQuery, page);
  }

  private searchDiscussions = async (
    searchTerm: string,
    params: SearchParams,
    page?: number
  ) => {
    const { resultSize, chainScope, communityScope, sort } = params;
    try {
      const queryParams = {
        chain: chainScope,
        community: communityScope,
        cutoff_date: null, // cutoffDate.toISOString(),
        search: searchTerm,
        results_size: resultSize,
        sort,
      };
      if (page) {
        queryParams['page'] = page;
      }
      const response = await $.get(
        `${app.serverUrl()}/searchDiscussions`,
        queryParams
      );
      if (response.status !== 'Success') {
        throw new Error(`Got unsuccessful status: ${response.status}`);
      }
      return response.result;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  private searchComments = async (searchTerm: string, params: SearchParams) => {
    const { resultSize, chainScope, communityScope, sort } = params;
    try {
      const response = await $.get(`${app.serverUrl()}/searchComments`, {
        chain: chainScope,
        community: communityScope,
        cutoff_date: null, // cutoffDate.toISOString(),
        search: searchTerm,
        results_size: resultSize,
        sort,
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

  public searchThreadTitles = async (
    searchTerm: string,
    params: SearchParams
  ): Promise<Thread[]> => {
    const { resultSize, chainScope, communityScope } = params;
    try {
      const response = await $.get(`${app.serverUrl()}/searchDiscussions`, {
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
        return app.threads.modelFromServer(rawThread);
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  public searchMentionableAddresses = async (
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

  private sortResults = (a, b) => {
    // TODO: Token-sorting approach
    // Some users are not verified; we give them a default date of 1900
    const aCreatedAt = moment(
      a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z'
    );
    const bCreatedAt = moment(
      b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z'
    );
    return bCreatedAt.diff(aCreatedAt);
  };

  private sortCommunities = (a, b) => {
    return (
      app.recentActivity.getCommunityThreadCount(b.id) -
      app.recentActivity.getCommunityThreadCount(a.id)
    );
  };

  public getHistory() {
    const rawHistory =
      JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    const history = [];
    // eslint-disable-next-line guard-for-in
    for (const entry of rawHistory) {
      history.push(SearchQuery.fromEncodedString(entry));
    }
    return history;
  }

  public addToHistory(query: SearchQuery) {
    this.removeFromHistory(query); // to refresh duplicates
    if (!this.isValidQuery(query)) return;
    const rawHistory =
      JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    if (rawHistory.length >= SEARCH_HISTORY_SIZE) {
      rawHistory.pop();
    }
    rawHistory.unshift(query.toEncodedString());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(rawHistory));
  }

  public removeFromHistory(query: SearchQuery) {
    const rawHistory =
      JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    const index = rawHistory.indexOf(query.toEncodedString());
    if (index > -1) {
      rawHistory.splice(index, 1);
    }
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(rawHistory));
  }

  public isValidQuery(searchQuery: SearchQuery) {
    return (
      searchQuery.searchTerm &&
      searchQuery.searchTerm.toString().trim() &&
      searchQuery.searchTerm.length > 3
    );
  }
}

export default SearchController;
