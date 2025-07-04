import { notifyError } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import _ from 'lodash';
import {
  SearchScope,
  SearchSort,
  VALID_SEARCH_SCOPES,
} from 'models/SearchQuery';
import useSidebarStore from 'state/ui/sidebar';
import './index.scss';

import useWindowResize from 'hooks/useWindowResize';
import React, { useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import app from 'state';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { LoadingIndicator } from 'views/components/LoadingIndicator/LoadingIndicator';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';
import { useSearchCommentsQuery } from '../../../../scripts/state/api/comments';
import { useSearchCommunitiesQuery } from '../../../../scripts/state/api/communities';
import { useSearchProfilesQuery } from '../../../../scripts/state/api/profiles';
import { useSearchThreadsQuery } from '../../../../scripts/state/api/threads';
import { useCommonNavigate } from '../../../navigation/helpers';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import ErrorPage from '../error';
import { renderSearchResults } from './helpers';

const VISIBLE_TABS = VALID_SEARCH_SCOPES.filter(
  (scope) => ![SearchScope.All, SearchScope.Proposals].includes(scope),
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
  communityScope?: string;
  sort?: string;
  tab?: string;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const commonNavigate = useCommonNavigate();
  const { setMenu } = useSidebarStore();

  const location = useLocation();
  const [urlQueryParams] = useSearchParams();
  const [bottomRef, bottomInView] = useInView();

  useWindowResize({
    setMenu,
  });

  const { data: domain } = useFetchCustomDomainQuery();

  const queryParams = useMemo(() => {
    return Object.fromEntries(urlQueryParams.entries()) as SearchQueryParams;
  }, [urlQueryParams]);

  const community =
    queryParams.communityScope || app.activeChainId() || 'all_communities';

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
    newQueryParams.set('communityScope', 'all_communities');
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
    // @ts-expect-error <StrictNullChecks/>
    SORT_MAP[queryParams.sort] || DEFAULT_SORT_OPTIONS;

  const search_term = queryParams.q || '';
  const community_id = community;
  const order_by = orderBy;
  const order_direction = orderDirection;

  const {
    data: threadsData,
    error: threadsError,
    fetchNextPage: threadsFetchNextPage,
    isLoading: threadsIsLoading,
  } = useSearchThreadsQuery({
    community_id,
    search_term,
    cursor: 1,
    limit: 20,
    order_by,
    order_direction,
    thread_title_only: true,
    include_count: true,
    enabled: activeTab === SearchScope.Threads && search_term?.length > 3,
  });

  const {
    data: commentsData,
    error: commentsError,
    fetchNextPage: commentsFetchNextPage,
    isLoading: commentsIsLoading,
  } = useSearchCommentsQuery({
    community_id,
    search: search_term,
    cursor: 1,
    limit: 20,
    order_by,
    order_direction,
    enabled: activeTab === SearchScope.Replies && search_term.length > 3,
  });

  const {
    data: communityData,
    error: communityError,
    fetchNextPage: chainsFetchNextPage,
    isLoading: communityIsLoading,
  } = useSearchCommunitiesQuery({
    search: search_term,
    cursor: 1,
    limit: 20,
    order_by: 'tier',
    order_direction: 'DESC',
    enabled: activeTab === SearchScope.Communities && search_term.length > 0,
  });

  const {
    data: profilesData,
    error: profilesError,
    fetchNextPage: profilesFetchNextPage,
    isLoading: profilesIsLoading,
  } = useSearchProfilesQuery({
    communityId: community,
    searchTerm: search_term,
    limit: 20,
    orderBy,
    orderDirection,
    enabled: activeTab === SearchScope.Members && search_term.length > 0,
  });

  const results = useMemo(() => {
    switch (activeTab) {
      case SearchScope.Threads:
        return (
          threadsData?.pages?.reduce((acc, p) => [...acc, ...p.results], []) ||
          []
        );
      case SearchScope.Replies:
        return (
          commentsData?.pages?.reduce((acc, p) => [...acc, ...p.results], []) ||
          []
        );
      case SearchScope.Communities:
        return (
          communityData?.pages?.reduce(
            (acc, p) => [...acc, ...p.results],
            [],
          ) || []
        );
      case SearchScope.Members:
        return (
          profilesData?.pages?.reduce((acc, p) => [...acc, ...p.results], []) ||
          []
        );
      default:
        return [];
    }
  }, [activeTab, communityData, commentsData, profilesData, threadsData]);

  const totalResults = useMemo(() => {
    switch (activeTab) {
      case SearchScope.Threads:
        return threadsData?.pages?.[0]?.totalResults || 0;
      case SearchScope.Replies:
        return commentsData?.pages?.[0]?.totalResults || 0;
      case SearchScope.Communities:
        return communityData?.pages?.[0]?.totalResults || 0;
      case SearchScope.Members:
        return profilesData?.pages?.[0]?.totalResults || 0;
      default:
        return 0;
    }
  }, [activeTab, communityData, commentsData, profilesData, threadsData]);

  const totalResultsText = pluralize(totalResults, activeTab.toLowerCase());
  const scopeText = useMemo(() => {
    if (community) {
      if (community === 'all_communities') {
        return 'across all communities.';
      }
      return `in ${_.capitalize(community)}.`;
    } else {
      // also applies when app.isCustomDomain() is true
      return '';
    }
  }, [community]);

  // when error, notify
  useEffect(() => {
    const err =
      threadsError || commentsError || communityError || profilesError;
    if (err) {
      notifyError(err.message);
    }
  }, [communityError, commentsError, profilesError, threadsError]);

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
        return communityIsLoading;
      case SearchScope.Members:
        return profilesIsLoading;
      default:
        return false;
    }
  }, [
    activeTab,
    communityIsLoading,
    commentsIsLoading,
    profilesIsLoading,
    threadsIsLoading,
  ]);

  return (
    <CWPageLayout>
      <div className="SearchPage">
        <div className="search-results">
          <div className="cw-tabs-row-container">
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
          </div>
          <>
            {search_term.length === 0 && (
              <ErrorPage message="No search term provided!" />
            )}
            {search_term.length > 0 && (
              <>
                {isLoading ? (
                  <LoadingIndicator />
                ) : (
                  <>
                    <CWText className="search-results-caption">
                      {totalResultsText} matching &apos;{queryParams.q}&apos;{' '}
                      {scopeText}
                      {community !== 'all_communities' &&
                        !domain?.isCustomDomain && (
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
                        activeTab,
                      ) && (
                        <div className="search-results-filters">
                          <CWText type="h5">Sort By:</CWText>
                          <CWDropdown
                            label=""
                            onSelect={handleSortChange}
                            initialValue={{
                              // @ts-expect-error <StrictNullChecks/>
                              label: queryParams.sort,
                              // @ts-expect-error <StrictNullChecks/>
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
                        results,
                        // @ts-expect-error <StrictNullChecks/>
                        queryParams.q,
                        activeTab,
                        commonNavigate,
                      )}
                      <div ref={bottomRef}></div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        </div>
      </div>
    </CWPageLayout>
  );
};

export default SearchPage;
