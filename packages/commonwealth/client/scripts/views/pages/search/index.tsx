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
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { CWText } from '../../components/component_kit/cw_text';
import { renderSearchResults } from './helpers';
import { useInView } from 'react-intersection-observer';
import { useCommonNavigate } from '../../../navigation/helpers';
import { useSearchThreadsQuery } from '../../../../scripts/state/api/threads';
import { useSearchCommentsQuery } from '../../../../scripts/state/api/comments';
import { useSearchChainsQuery } from '../../../../scripts/state/api/chains';
import { useSearchProfilesQuery } from '../../../../scripts/state/api/profiles';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';

const VISIBLE_TABS = VALID_SEARCH_SCOPES.filter(
  (scope) => ![SearchScope.All, SearchScope.Proposals].includes(scope)
);

// maps client-side sort options to server-side sort options
const SORT_MAP: Record<string, [APIOrderBy, APIOrderDirection]> = {
  Best: [APIOrderBy.Rank, APIOrderDirection.Desc],
  Newest: [APIOrderBy.CreatedAt, APIOrderDirection.Desc],
  Oldest: [APIOrderBy.CreatedAt, APIOrderDirection.Asc],
};
const DEFAULT_SORT_OPTIONS = SORT_MAP.Best;

type SearchQueryParams = {
  q?: string;
  chainScope?: string;
  sort?: string;
  tab?: string;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const commonNavigate = useCommonNavigate();

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

  const [orderBy, orderDirection] =
    SORT_MAP[queryParams.sort] || DEFAULT_SORT_OPTIONS;

  const sharedQueryOptions = {
    chainId: app.activeChainId() || 'all_chains',
    searchTerm: queryParams.q,
    limit: 20,
    orderBy,
    orderDirection,
  };

  const {
    data: threadsData,
    error: threadsError,
    fetchNextPage: threadsFetchNextPage,
    isLoading: threadsIsLoading,
  } = useSearchThreadsQuery({
    ...sharedQueryOptions,
    enabled: activeTab === SearchScope.Threads,
  });

  const {
    data: commentsData,
    error: commentsError,
    fetchNextPage: commentsFetchNextPage,
    isLoading: commentsIsLoading,
  } = useSearchCommentsQuery({
    ...sharedQueryOptions,
    enabled: activeTab === SearchScope.Replies,
  });

  const {
    data: chainsData,
    error: chainsError,
    fetchNextPage: chainsFetchNextPage,
    isLoading: chainsIsLoading,
  } = useSearchChainsQuery({
    ...sharedQueryOptions,
    enabled: activeTab === SearchScope.Communities,
  });

  const {
    data: profilesData,
    error: profilesError,
    fetchNextPage: profilesFetchNextPage,
    isLoading: profilesIsLoading,
  } = useSearchProfilesQuery({
    ...sharedQueryOptions,
    includeRoles: true,
    enabled: activeTab === SearchScope.Members,
  });

  const results = useMemo(() => {
    switch (activeTab) {
      case SearchScope.Threads:
        return (
          threadsData?.pages.reduce((acc, p) => [...acc, ...p.results], []) ||
          []
        );
      case SearchScope.Replies:
        return (
          commentsData?.pages.reduce((acc, p) => [...acc, ...p.results], []) ||
          []
        );
      case SearchScope.Communities:
        return (
          chainsData?.pages.reduce((acc, p) => [...acc, ...p.results], []) || []
        );
      case SearchScope.Members:
        return (
          profilesData?.pages.reduce((acc, p) => [...acc, ...p.results], []) ||
          []
        );
      default:
        return [];
    }
  }, [activeTab, chainsData, commentsData, profilesData, threadsData]);

  const totalResults = useMemo(() => {
    switch (activeTab) {
      case SearchScope.Threads:
        return threadsData?.pages?.[0]?.totalResults || 0;
      case SearchScope.Replies:
        return commentsData?.pages?.[0]?.totalResults || 0;
      case SearchScope.Communities:
        return chainsData?.pages?.[0]?.totalResults || 0;
      case SearchScope.Members:
        return profilesData?.pages?.[0]?.totalResults || 0;
      default:
        return 0;
    }
  }, [activeTab, chainsData, commentsData, profilesData, threadsData]);

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
    const err = threadsError || commentsError || chainsError || profilesError;
    if (err) {
      notifyError((err as Error).message);
    }
  }, [chainsError, commentsError, profilesError, threadsError]);

  // when scroll to bottom, fetch next page
  useEffect(() => {
    if (bottomInView) {
      switch (activeTab) {
        case SearchScope.Threads:
          threadsFetchNextPage();
          break;
        case SearchScope.Replies:
          commentsFetchNextPage();
          break;
        case SearchScope.Communities:
          chainsFetchNextPage();
          break;
        case SearchScope.Members:
          profilesFetchNextPage();
          break;
      }
    }
  }, [
    activeTab,
    bottomInView,
    threadsFetchNextPage,
    commentsFetchNextPage,
    chainsFetchNextPage,
    profilesFetchNextPage,
  ]);

  const isLoading = useMemo(() => {
    switch (activeTab) {
      case SearchScope.Threads:
        return threadsIsLoading;
      case SearchScope.Replies:
        return commentsIsLoading;
      case SearchScope.Communities:
        return chainsIsLoading;
      case SearchScope.Members:
        return profilesIsLoading;
      default:
        return false;
    }
  }, [
    activeTab,
    chainsIsLoading,
    commentsIsLoading,
    profilesIsLoading,
    threadsIsLoading,
  ]);

  return (
    <div className="SearchPage">
      <>
        <div className="search-results">
          <CWTabsRow>
            {VISIBLE_TABS.map((s, i) => (
              <CWTab
                key={i}
                label={s}
                isSelected={activeTab === s}
                onClick={() => setActiveTab(s)}
              />
            ))}
          </CWTabsRow>
          <>
            {isLoading && <PageLoading />}
            {!isLoading && (
              <>
                <CWText isCentered className="search-results-caption">
                  {totalResultsText} matching &apos;{queryParams.q}&apos;{' '}
                  {scopeText}
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
                    commonNavigate
                  )}
                  <div ref={bottomRef}></div>
                </div>
              </>
            )}
          </>
        </div>
      </>
    </div>
  );
};

export default SearchPage;
