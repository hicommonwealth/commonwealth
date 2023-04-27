import $ from 'jquery';
import moment from 'moment';
import app from 'state';
import SearchStore from 'stores/SearchStore';
import { SearchContentType } from 'types';
import type { Thread } from '../../models';
import { SearchQuery } from '../../models';
import type { SearchParams } from '../../models/SearchQuery';
import { SearchScope } from '../../models/SearchQuery';

const SEARCH_PREVIEW_SIZE = 6;
const SEARCH_PAGE_SIZE = 10;
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
    const pageSize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;
    const scope = searchQuery.getSearchScope();

    try {
      if (
        scope.includes(SearchScope.Threads) ||
        scope.includes(SearchScope.Proposals)
      ) {
        const discussions = await this.searchDiscussions(searchTerm, {
          pageSize,
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
          pageSize,
          chainScope,
          sort,
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
          { pageSize, chainScope },
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
    searchQuery: SearchQuery,
    tab: SearchScope,
    page: number,
    pageSize: number
  ) {
    const { searchTerm, chainScope, sort } = searchQuery;
    const searchParams = {
      pageSize,
      chainScope,
      sort,
    };
    switch (tab) {
      case SearchScope.Threads: {
        const discussions = await this.searchDiscussions(
          searchTerm,
          searchParams,
          page
        );
        return discussions.map((row) => {
          return {
            ...row,
            SearchContentType: SearchContentType.Thread,
            searchType: SearchScope.Threads,
          };
        });
      }
      case SearchScope.Replies: {
        const replies = await this.searchComments(
          searchTerm,
          searchParams,
          page
        );
        return replies.map((row) => {
          return {
            ...row,
            SearchContentType: SearchContentType.Comment,
            searchType: SearchScope.Replies,
          };
        });
      }
      default:
        return [];
    }
  }

  private searchDiscussions = async (
    searchTerm: string,
    params: SearchParams,
    page?: number
  ) => {
    const { pageSize, chainScope, communityScope, sort } = params;
    try {
      const queryParams = {
        chain: chainScope,
        community: communityScope,
        search: searchTerm,
        page_size: pageSize,
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

  private searchComments = async (
    searchTerm: string,
    params: SearchParams,
    page?: number
  ) => {
    const { pageSize, chainScope, communityScope, sort } = params;
    try {
      const queryParams = {
        chain: chainScope,
        community: communityScope,
        search: searchTerm,
        page_size: pageSize,
        sort,
      };
      if (page) {
        queryParams['page'] = page;
      }
      const response = await $.get(
        `${app.serverUrl()}/searchComments`,
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

  public searchThreadTitles = async (
    searchTerm: string,
    params: SearchParams
  ): Promise<Thread[]> => {
    const { pageSize, chainScope, communityScope } = params;
    try {
      const response = await $.get(`${app.serverUrl()}/searchDiscussions`, {
        chain: chainScope,
        community: communityScope,
        search: searchTerm,
        results_size: pageSize,
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
    const { pageSize, communityScope, chainScope } = params;
    try {
      const response = await $.get(`${app.serverUrl()}/bulkAddresses`, {
        chain: chainScope,
        community: communityScope,
        limit: pageSize,
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
