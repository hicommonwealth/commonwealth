import $ from 'jquery';
import moment from 'moment';
import SearchStore from "stores/SearchStore";
import app from 'state';
import { SearchScope } from '../../models/SearchQuery';
import { OffchainThread, CommunityInfo, SearchQuery } from "../../models";
import { modelFromServer } from './threads';

export const ALL_RESULTS_QUERY = new SearchQuery('COMMONWEALTH_ALL_RESULTS');
const SEARCH_PREVIEW_SIZE = 6;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query
const SEARCH_HISTORY_KEY = "COMMONWEALTH_SEARCH_HISTORY"
const SEARCH_HISTORY_SIZE = 20
export interface SearchParams {
    communityScope?: string;
    chainScope?: string;
    isSearchPreview?: boolean;
    isHomepageSearch?: boolean;
    resultSize?: number;
}

export enum ContentType {
    Thread = 'thread',
    Comment = 'comment',
    Community = 'community',
    Chain = 'chain',
    Token = 'token',
    Member = 'member'
}

export enum SearchType {
  Discussion = 'discussion',
  Community = 'community',
  Member = 'member',
  Top = 'top',
}
class SearchContoller {
  private _store: SearchStore = new SearchStore();
  public store() { return this._store; }

  public getByQuery(query: SearchQuery){
    if(query.searchTerm.length > 3){
      return this._store.getByQueryString(query.toEncodedString())
    }
    return null
  }

  public async initialize() {
    const allCommunitiesSearch = this._store.getOrAdd(ALL_RESULTS_QUERY)
    if(!this.getByQuery(ALL_RESULTS_QUERY)?.loaded) {
        try {
            const getTokens = () =>
                $.getJSON('/api/getTokensFromLists').then((response) => {
                if (response.status === 'Failure') {
                    throw response.message;
                } else {
                    return response.result;
                }
            })
            const tokens = await getTokens();
            allCommunitiesSearch.results[SearchType.Community] = tokens
        } catch (err) {
            allCommunitiesSearch.results[SearchType.Community] = []
        } finally {
            allCommunitiesSearch.loaded = true
            this._store.update(allCommunitiesSearch)
        }
    }
  }

  public async search(searchQuery: SearchQuery) {
    if (this.getByQuery(searchQuery)?.loaded) {
      return this.getByQuery(searchQuery)
    }
    const searchCache = this._store.getOrAdd(searchQuery)
    const { searchTerm, communityScope, chainScope, isSearchPreview, searchScope } = searchQuery;
    const resultSize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;
    const getAllResults = searchScope.includes(SearchScope.ALL)

    if (!this.getByQuery(ALL_RESULTS_QUERY)?.loaded){
      await this.initialize()
    }

    try {
      if(getAllResults ||
        searchScope.includes(SearchScope.THREADS) || searchScope.includes(SearchScope.PROPOSALS)){

        const discussions = await this.searchDiscussions(searchTerm, {
          resultSize,
          communityScope,
          chainScope,
        })

        searchCache.results[SearchType.Discussion] = discussions
        .map((discussion) => {
            discussion.contentType = ContentType.Thread;
            discussion.searchType = SearchType.Discussion;
            return discussion;
        })
      }

      if (getAllResults || searchScope.includes(SearchScope.MEMBERS)){
        const addrs = await this.searchMentionableAddresses(
            searchTerm,
            { resultSize, communityScope, chainScope },
            ['created_at', 'DESC']
          )

        searchCache.results[SearchType.Member] = addrs
        .map((addr) => {
            addr.contentType = ContentType.Member;
            addr.searchType = SearchType.Member;
            return addr;
        })
        .sort(this.sortResults);
      }

      if (getAllResults || searchScope.includes(SearchScope.COMMENTS)) {
        const comments = await this.searchComments(searchTerm, {
          resultSize,
          communityScope,
          chainScope,
        })

        comments.map(comment => {
          comment.contentType = ContentType.Comment
          comment.searchType = SearchType.Discussion
          return comment
        })

        if(getAllResults || searchScope.includes(SearchScope.THREADS)){
          searchCache.results[SearchType.Discussion] = searchCache.results[SearchType.Discussion]
            .concat(comments)
            .sort(({rank : a}, {rank : b}) => b-a)
            .slice(0, resultSize)
        } else {
          searchCache.results[SearchType.Discussion] = comments
        }
      }

      if (getAllResults || searchScope.includes(SearchScope.COMMUNITIES)){
        const unfilteredTokens = this.getByQuery(ALL_RESULTS_QUERY).results[SearchType.Community];
        const tokens = unfilteredTokens.filter((token) =>
            token.name?.toLowerCase().includes(searchTerm)
        );
        searchCache.results[SearchType.Community] = tokens.map((token) => {
            token.contentType = ContentType.Token;
            token.searchType = SearchType.Community;
            return token;
        });

        const allComms = (app.config.chains.getAll() as any).concat(app.config.communities.getAll() as any);
        const filteredComms = allComms.filter((comm) => {
            return (
                comm.name?.toLowerCase().includes(searchTerm) ||
                comm.symbol?.toLowerCase().includes(searchTerm)
            );
        });
        searchCache.results[SearchType.Community] = searchCache.results[SearchType.Community]
            .concat(filteredComms.map((commOrChain) => {
              commOrChain.contentType = commOrChain instanceof CommunityInfo ?
                ContentType.Community : ContentType.Chain;
              commOrChain.searchType = SearchType.Community;
              return commOrChain;
            })).sort(this.sortResults);
      }
    } finally {
      searchCache.loaded = true
      this._store.update(searchCache)
    }
  }

  private searchDiscussions = async (
    searchTerm: string,
    params: SearchParams
  ) => {
    const { resultSize, chainScope, communityScope } = params;
    try {
        const response = await $.get(`${app.serverUrl()}/searchDiscussions`, {
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
  }

  private searchComments = async (
    searchTerm: string,
    params: SearchParams
  ) => {
    const { resultSize, chainScope, communityScope } = params;
    try {
        const response = await $.get(`${app.serverUrl()}/searchComments`, {
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
  }

  public searchThreadTitles = async (
    searchTerm: string,
    params: SearchParams
  ): Promise<OffchainThread[]> => {
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
        return modelFromServer(rawThread);
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

  public getHistory() {
    const rawHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []
    const history = []
    for(let i = 0; i < rawHistory.length; i++){
      history.push(SearchQuery.fromEncodedString(rawHistory[i]))
    }
    return history
  }

  public addToHistory(query: SearchQuery) {
    this.removeFromHistory(query) // to ignore duplicates
    const rawHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []
    if(rawHistory.length >= SEARCH_HISTORY_SIZE){
      rawHistory.pop()
    }
    rawHistory.unshift(query.toEncodedString())
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(rawHistory))
  }

  public removeFromHistory(query: SearchQuery) {
    const rawHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []
    const index = rawHistory.indexOf(query.toEncodedString())
    if(index > -1){
      rawHistory.splice(index, 1)
    }
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(rawHistory))
  }
}

export default SearchContoller