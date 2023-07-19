import { notifyError } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { capitalize, debounce, uniqBy } from 'lodash';
import SearchQuery, {
  SearchScope,
  SearchSort,
  VALID_SEARCH_SCOPES,
} from 'models/SearchQuery';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/search/index.scss';
import QueryString from 'qs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  NavigateOptions,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import app from 'state';
import { PageLoading } from 'views/pages/loading';
import type { DropdownItemType } from '../../components/component_kit/cw_dropdown';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { renderSearchResults } from './helpers';
import axios from 'axios';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

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
  const navigate = useCommonNavigate();
  const [urlQueryParams, setUrlQueryParams] = useSearchParams();

  // const debouncedSetPage = useCallback(debounce(setPage, 200), []);

  const [bottomRef, bottomInView] = useInView();

  const queryParams = useMemo(() => {
    return Object.fromEntries(urlQueryParams.entries()) as SearchQueryParams;
  }, [urlQueryParams]);

  const activeTab = useMemo(() => {
    if (VALID_SEARCH_SCOPES.includes(queryParams.tab as SearchScope)) {
      return queryParams.tab as SearchScope;
    }
    return SearchScope.Threads;
  }, [queryParams]);

  const setActiveTab = (newTab: SearchScope) => {
    const newQueryParams = new URLSearchParams(urlQueryParams.toString());
    newQueryParams.set('tab', newTab);
    setUrlQueryParams(urlQueryParams, { replace: true });
  };

  const fetchSearchResults = async ({ pageParam = 0 }) => {
    const urlParams = {
      chain: queryParams.chainScope,
      search: queryParams.q,
      limit: (10).toString(),
      page: pageParam.toString(),
      order_by: 'rank',
      order_direction: 'DESC',
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
          return '/api/members';
        case SearchScope.Communities:
          return '/api/communities';
        case SearchScope.Replies:
          return '/api/profiles';
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
    console.log('RESULT: ', result);
    return result;
  };

  const { isLoading, error, data, fetchNextPage } = useInfiniteQuery(
    ['search', activeTab],
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

  const searchResults = useMemo(() => {
    if (!data?.pages) {
      return [];
    }
    return data.pages.reduce((acc, page) => {
      return [...acc, ...page.results];
      // return uniqBy([...acc, ...page.results], 'id');
    }, []);
  }, [data]);

  const handleSearchAllCommunities = () => null;

  const handleSortChange = () => null;

  const totalResults = data?.pages[0]?.totalResults || 0;
  const totalResultsText = pluralize(totalResults, activeTab.toLowerCase());
  const scopeText = useMemo(() => {
    if (queryParams.chainScope) {
      if (queryParams.chainScope === 'all_chains') {
        return 'in all communities.';
      }
      return `in ${capitalize(queryParams.chainScope)}.`;
    } else if (app.isCustomDomain()) {
      return '';
    } else {
      return 'across all communities.';
    }
  }, [queryParams]);

  useEffect(() => {
    if (bottomInView) {
      fetchNextPage();
    }
  }, [bottomInView]);

  const visibleTabs = VALID_SEARCH_SCOPES;

  return (
    <div className="SearchPage">
      {isLoading && <PageLoading />}
      {!isLoading && (
        <>
          <div className="search-results">
            {visibleTabs.length > 0 &&
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
            <CWTabBar>
              {visibleTabs.map((s, i) => (
                <CWTab
                  key={i}
                  label={s}
                  isSelected={activeTab === s}
                  onClick={() => setActiveTab(s)}
                />
              ))}
            </CWTabBar>
            <CWText isCentered className="search-results-caption">
              {totalResultsText} matching '{queryParams.q}' {scopeText}
              {queryParams.chainScope !== 'all_chains' &&
                !app.isCustomDomain() && (
                  <a
                    href="#"
                    className="search-all-communities"
                    onClick={handleSearchAllCommunities}
                  >
                    Search all communities?
                  </a>
                )}
            </CWText>
            <div className="search-results-list">
              {renderSearchResults(
                searchResults as any,
                queryParams.q,
                activeTab,
                navigate
              )}
              <div ref={bottomRef}></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;
