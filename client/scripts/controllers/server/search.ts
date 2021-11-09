import $ from 'jquery';
import moment from 'moment';
import SearchStore from "client/scripts/stores/SearchStore";
import app from 'state';
import { OffchainThread, CommunityInfo } from "../../models";
import { modelFromServer } from './threads';

export const ALL_RESULTS_KEY = 'COMMONWEALTH_ALL_RESULTS';
const SEARCH_PREVIEW_SIZE = 6;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

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
    public get store() { return this._store; }

    public getByTerm(term: string){
        return this._store.getByTerm(term)
    }

    public async initialize() {
        const allCommunitiesSearch = this._store.getOrAdd(ALL_RESULTS_KEY)[0]
        if(!this._store.getByTerm[ALL_RESULTS_KEY]?.loaded) {
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

    public async search(searchTerm: string, params: SearchParams) {
        searchTerm = searchTerm.toLowerCase();
        const { isSearchPreview, isHomepageSearch, communityScope, chainScope } = params;
        const resultSize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;
        if (this._store.getByTerm(searchTerm)?.loaded) {
            return this._store.getByTerm(searchTerm)
        }
        const searchCache = this._store.getOrAdd(searchTerm)

        const [discussions, addrs] = await Promise.all([
            this.searchDiscussions(searchTerm, {
            resultSize,
            communityScope,
            chainScope,
            }),
            this.searchMentionableAddresses(
            searchTerm,
            { resultSize, communityScope, chainScope },
            ['created_at', 'DESC']
            ),
        ]);

        searchCache.results[SearchType.Discussion] = discussions
        .map((discussion) => {
            discussion.contentType = discussion.root_id
            ? ContentType.Comment
            : ContentType.Thread;
            discussion.searchType = SearchType.Discussion;
            return discussion;
        })
        .sort(this.sortResults);

        searchCache.results[SearchType.Member] = addrs
        .map((addr) => {
            addr.contentType = ContentType.Member;
            addr.searchType = SearchType.Member;
            return addr;
        })
        .sort(this.sortResults);

        const unfilteredTokens = this._store.getByTerm(ALL_RESULTS_KEY)['tokens'];
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
            return commOrChain;
            })).sort(this.sortResults);

        searchCache.loaded = true
        this._store.update(searchCache)
        return searchCache
    }

    private searchDiscussions = async (
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
    }

    private searchThreadTitles = async (
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

    private searchMentionableAddresses = async (
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

}

export default SearchContoller