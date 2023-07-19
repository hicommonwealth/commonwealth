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

  const [page, setPage] = useState<number>(1);
  const debouncedSetPage = useCallback(debounce(setPage, 200), []);

  const { bottomRef, bottomInView } = useInView();

  const queryParams = useMemo(() => {
    return Object.fromEntries(urlQueryParams.entries()) as SearchQueryParams;
  }, [urlQueryParams]);

  const activeTab = useMemo(() => {
    if (VALID_SEARCH_SCOPES.includes(queryParams.tab as SearchScope)) {
      return queryParams.tab;
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

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [`search`, activeTab, page],
    queryFn: () => fetchSearchResults,
    getNextPageParam: async (lastPage) => {
      return (lastPage as any).nextPage + 1;
    },
  });

  useEffect(() => {
    if (bottomInView) {
      fetchNextPage();
    }
  }, [bottomInView]);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;

  // const tabScopedListing = useMemo(() => {
  //   return renderSearchResults(
  //     result,
  //     searchQuery.searchTerm,
  //     searchQuery.sort,
  //     activeTab as SearchScope,
  //     navigate
  //   );
  // }, [
  //   activeTab,
  //   navigate,
  //   searchQuery.searchTerm,
  //   searchQuery.sort,
  //   searchResults,
  // ]);

  const resultCount =
    tabScopedListing.length >= 10
      ? `${tabScopedListing.length}+ ${pluralize(
          2,
          activeTab.toLowerCase()
        ).replace('2 ', '')}`
      : pluralize(tabScopedListing.length, activeTab.toLowerCase());

  const getCaptionScope = () => {
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
  };

  const handleSortChange = (option: DropdownItemType) => {};

  const handleSearchAllCommunities = () => {};

  const handleScroll = () => {
    if (!isLoadingPage && bottomEl.current) {
      const offset = 0;
      const top = bottomEl.current.getBoundingClientRect().top;
      const isInViewport =
        top + offset >= 0 && top - offset <= window.innerHeight;
      if (isInViewport) {
        debouncedSetPage(page + 1);
      }
    }
  };

  return !app.search.getByQuery(searchQuery)?.loaded ? (
    <PageLoading />
  ) : (
    <div className="SearchPage" onScroll={handleScroll}>
      <div className="search-results">
        <CWTabBar>
          {searchQuery.getSearchScope().map((s, i) => (
            <CWTab
              key={i}
              label={s}
              isSelected={activeTab === s}
              onClick={() => setActiveTab(s)}
            />
          ))}
        </CWTabBar>
        <CWText isCentered className="search-results-caption">
          {resultCount} matching '{searchQuery.searchTerm}' {getCaptionScope()}
          {searchQuery.chainScope !== 'all_chains' && !app.isCustomDomain() && (
            <a
              href="#"
              className="search-all-communities"
              onClick={handleSearchAllCommunities}
            >
              Search all communities?
            </a>
          )}
        </CWText>
        {tabScopedListing.length > 0 &&
          ['Threads', 'Replies'].includes(activeTab) && (
            <div className="search-results-filters">
              <CWText type="h5">Sort By:</CWText>
              <CWDropdown
                label=""
                onSelect={handleSortChange}
                initialValue={{
                  label: searchQuery.sort,
                  value: searchQuery.sort,
                }}
                options={Object.keys(SearchSort).map((k) => ({
                  label: k,
                  value: k,
                }))}
              />
            </div>
          )}
        <div className="search-results-list">
          {tabScopedListing}
          <div ref={bottomElRef}></div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
