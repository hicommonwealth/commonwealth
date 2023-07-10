import { notifyError } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { capitalize, debounce, uniqBy } from 'lodash';
import SearchQuery, { SearchScope, SearchSort } from 'models/SearchQuery';
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
import { NavigateOptions, useSearchParams } from 'react-router-dom';
import app from 'state';
import { PageLoading } from 'views/pages/loading';
import type { DropdownItemType } from '../../components/component_kit/cw_dropdown';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { getListing } from './helpers';

const SearchPage = () => {
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState({});
  const [page, setPage] = useState<number>(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const searchQuery = useMemo(
    () => SearchQuery.fromUrlParams(Object.fromEntries(searchParams.entries())),
    [searchParams]
  );

  const activeTab = useMemo(() => {
    return (
      (QueryString.parse(window.location.search.replace('?', ''))[
        'tab'
      ] as SearchScope) || SearchScope.Threads
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setActiveTab = (newTab: SearchScope) => {
    navigate(`/search?${searchQuery.toUrlParams()}&tab=${newTab}`, {
      replace: true,
    } as NavigateOptions);
  };

  const debouncedSetPage = useCallback(debounce(setPage, 200), []);

  const bottomEl = useRef(null);

  // when tab or query is updated, load first page
  const handleSearch = useCallback(async () => {
    try {
      setPage(1);
      if (!searchQuery.chainScope) {
        searchQuery.chainScope = 'all_chains';
      }
      const response = await app.search.search(searchQuery);
      setSearchResults(response.results);
    } catch (err) {
      setSearchResults({});
      notifyError(
        err.responseJSON?.error || err.responseText || err.toString()
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // when scroll page changes, append new results
  const handleLoadNextPage = useCallback(async () => {
    try {
      if (page <= 1) {
        return;
      }
      setIsLoadingPage(true);
      const results = await app.search.searchPaginated(
        searchQuery,
        activeTab,
        page,
        10
      );
      setSearchResults((oldSearchResults) => {
        const newResults = (oldSearchResults[activeTab] || []).concat(results);
        return {
          ...oldSearchResults,
          [activeTab]: uniqBy(
            newResults,
            (result: any) => result.id || result.proposalid
          ),
        };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  useEffect(() => {
    handleLoadNextPage();
  }, [handleLoadNextPage]);

  const tabScopedListing = useMemo(() => {
    // deduplicate results
    const dedupedResults = {
      ...searchResults,
      [SearchScope.Threads]: uniqBy(
        (searchResults as any).Threads,
        (t: any) => t.proposalid
      ),
      [SearchScope.Replies]: uniqBy(
        (searchResults as any).Replies,
        (r: any) => r.id
      ),
    };
    return getListing(
      dedupedResults,
      searchQuery.searchTerm,
      searchQuery.sort,
      activeTab as SearchScope,
      navigate
    );
  }, [
    activeTab,
    navigate,
    searchQuery.searchTerm,
    searchQuery.sort,
    searchResults,
  ]);

  const resultCount =
    tabScopedListing.length >= 10
      ? `${tabScopedListing.length}+ ${pluralize(
        2,
        activeTab.toLowerCase()
      ).replace('2 ', '')}`
      : pluralize(tabScopedListing.length, activeTab.toLowerCase());

  const getCaptionScope = () => {
    if (searchQuery.chainScope) {
      if (searchQuery.chainScope === 'all_chains') {
        return 'in all communities.';
      }
      return `in ${capitalize(searchQuery.chainScope)}.`;
    } else if (app.isCustomDomain()) {
      return '';
    } else {
      return 'across all communities.';
    }
  };

  const handleSortChange = (option: DropdownItemType) => {
    const newSearchQuery = SearchQuery.fromUrlParams(
      Object.fromEntries(searchParams.entries())
    );
    newSearchQuery.sort = SearchSort[option.value];
    navigate(`/search?${newSearchQuery.toUrlParams()}&tab=${activeTab}`, {
      replace: true,
    } as NavigateOptions);
  };

  const handleSearchAllCommunities = () => {
    const newSearchQuery = SearchQuery.fromUrlParams(
      Object.fromEntries(searchParams.entries())
    );
    newSearchQuery.chainScope = undefined;
    navigate(`/search?${newSearchQuery.toUrlParams()}&tab=${activeTab}`);
  };

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
          <div ref={bottomEl}></div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
