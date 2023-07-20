import { notifyError } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { capitalize } from 'lodash';
import {
  SearchScope,
  SearchSort,
  VALID_SEARCH_SCOPES,
} from 'models/SearchQuery';
import 'pages/search/index.scss';

import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import app from 'state';
import { PageLoading } from 'views/pages/loading';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { renderSearchResults } from './helpers';
import axios from 'axios';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

const VISIBLE_TABS = VALID_SEARCH_SCOPES.filter(
  (scope) => !['All', 'Proposals'].includes(scope)
);

// maps client-side sort options to server-side sort options
const SORT_MAP: Record<string, string[]> = {
  Best: ['rank', 'DESC'],
  Newest: ['created_at', 'DESC'],
  Oldest: ['created_at', 'ASC'],
};
const DEFAULT_SORT_OPTIONS = ['rank', 'DESC'];

type SearchQueryParams = {
  q?: string;
  chainScope?: string;
  sort?: string;
  tab?: string;
};
type SearchResultsPayload = {
  results: any[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [urlQueryParams] = useSearchParams();
  const [bottomRef, bottomInView] = useInView();

  const queryParams = useMemo(() => {
    return Object.fromEntries(urlQueryParams.entries()) as SearchQueryParams;
  }, [urlQueryParams]);

  const chain = queryParams.chainScope || app.activeChainId() || 'all_chains';

  const activeTab = useMemo(() => {
    if (VALID_SEARCH_SCOPES.includes(queryParams.tab as SearchScope)) {
      return queryParams.tab as SearchScope;
    }
    return SearchScope.Threads;
  }, [queryParams]);

  const setActiveTab = (newTab: SearchScope) => {
    const newQueryParams = new URLSearchParams(urlQueryParams.toString());
    newQueryParams.set('tab', newTab);
    navigate({
      pathname: location.pathname,
      search: `?${newQueryParams.toString()}`,
    });
  };

  const fetchSearchResults = async ({ pageParam = 0 }) => {
    const [orderBy, orderDirection] =
      SORT_MAP[queryParams.sort] || DEFAULT_SORT_OPTIONS;
    const urlParams = {
      chain: chain,
      search: queryParams.q,
      limit: (10).toString(),
      page: pageParam.toString(),
      order_by: orderBy,
      order_direction: orderDirection,
    };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(urlParams)) {
      q.set(k, v);
    }

    const url = (() => {
      switch (activeTab) {
        case SearchScope.Threads:
          return '/api/threads';
        case SearchScope.Members:
          return '/api/profiles';
        case SearchScope.Communities:
          return '/api/chains';
        case SearchScope.Replies:
          return '/api/comments';
        default:
          throw new Error(`invalid tab for search: ${activeTab}`);
      }
    })();

    const {
      data: { result },
    } = await axios.get<{ result: SearchResultsPayload }>(
      `${url}?${q.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return result;
  };

  const handleSearchAllCommunities = () => {
    const newQueryParams = new URLSearchParams(urlQueryParams.toString());
    newQueryParams.set('chainScope', 'all_chains');
    navigate({
      pathname: location.pathname,
      search: `?${newQueryParams.toString()}`,
    });
  };

  const handleSortChange = (newSort) => {
    const sort = newSort.value;
    const newQueryParams = new URLSearchParams(urlQueryParams.toString());
    newQueryParams.set('sort', sort);
    navigate({
      pathname: location.pathname,
      search: `?${newQueryParams.toString()}`,
    });
  };

  const { isLoading, error, data, fetchNextPage } = useInfiniteQuery(
    [
      'search',
      {
        tab: activeTab,
        searchTerm: queryParams.q,
        sortBy: queryParams.sort,
        chain: queryParams.chainScope,
      },
    ],
    fetchSearchResults,
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
    }
  );

  const results = useMemo(() => {
    if (!data?.pages) {
      return [];
    }
    return data.pages.reduce((acc, page) => {
      return [...acc, ...page.results];
    }, []);
  }, [data]);

  const totalResults = data?.pages[0]?.totalResults || 0;
  const totalResultsText = pluralize(totalResults, activeTab.toLowerCase());
  const scopeText = useMemo(() => {
    if (chain) {
      if (chain === 'all_chains') {
        return 'across all communities.';
      }
      return `in ${capitalize(chain)}.`;
    } else {
      // also applies when app.isCustomDomain() is true
      return '';
    }
  }, [chain]);

  // when error, notify
  useEffect(() => {
    if (error) {
      notifyError((error as Error).message);
    }
  }, [error]);

  // when scroll to bottom, fetch next page
  useEffect(() => {
    if (bottomInView) {
      fetchNextPage();
    }
  }, [bottomInView]);

  return (
    <div className="SearchPage">
      {
        <>
          <div className="search-results">
            <CWTabBar>
              {VISIBLE_TABS.map((s, i) => (
                <CWTab
                  key={i}
                  label={s}
                  isSelected={activeTab === s}
                  onClick={() => setActiveTab(s)}
                />
              ))}
            </CWTabBar>
            <>
              {isLoading && <PageLoading />}
              {!isLoading && (
                <>
                  <CWText isCentered className="search-results-caption">
                    {totalResultsText} matching '{queryParams.q}' {scopeText}
                    {chain !== 'all_chains' && !app.isCustomDomain() && (
                      <a
                        href="#"
                        className="search-all-communities"
                        onClick={handleSearchAllCommunities}
                      >
                        Search all communities?
                      </a>
                    )}
                  </CWText>
                  {VISIBLE_TABS.length > 0 &&
                    [SearchScope.Threads, SearchScope.Replies].includes(
                      activeTab
                    ) && (
                      <div className="search-results-filters">
                        <CWText type="h5">Sort By:</CWText>
                        <CWDropdown
                          label=""
                          onSelect={handleSortChange}
                          initialValue={{
                            label: queryParams.sort,
                            value: queryParams.sort,
                          }}
                          options={Object.keys(SearchSort).map((k) => ({
                            label: k,
                            value: k,
                          }))}
                        />
                      </div>
                    )}
                  <div className="search-results-list">
                    {renderSearchResults(
                      results as any,
                      queryParams.q,
                      activeTab,
                      navigate
                    )}
                    <div ref={bottomRef}></div>
                  </div>
                </>
              )}
            </>
          </div>
        </>
      }
    </div>
  );
};

export default SearchPage;
