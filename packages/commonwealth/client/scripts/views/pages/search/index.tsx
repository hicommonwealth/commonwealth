import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { capitalize } from 'lodash';

import 'pages/search/index.scss';

import type { SearchScope } from 'models/SearchQuery';
import { SearchSort } from 'models/SearchQuery';

import app from 'state';
import { pluralize } from 'helpers';
import { SearchQuery } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import type { DropdownItemType } from '../../components/component_kit/cw_dropdown';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { useCommonNavigate } from 'navigation/helpers';
import { getListing } from './helpers';

const SEARCH_PAGE_SIZE = 50;

const SearchPage = () => {
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState({});
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [page, setPage] = useState(1);

  const searchQuery = useMemo(
    () => SearchQuery.fromUrlParams(Object.fromEntries(searchParams.entries())),
    [searchParams]
  );
  const [activeTab, setActiveTab] = useState<SearchScope>(
    searchQuery.getSearchScope()[0]
  );
  const bottomEl = useRef(null);

  const handleSearch = useCallback(async () => {
    try {
      if (!searchQuery.chainScope) {
        searchQuery.chainScope = 'all_chains';
      }
      const response = await app.search.search(searchQuery);

      console.log({ response });

      setSearchResults(
        Object.fromEntries(
          Object.entries(response.results).map(([k, v]) => [
            k,
            v.slice(0, SEARCH_PAGE_SIZE),
          ])
        )
      );
    } catch (err) {
      setSearchResults({});
      notifyError(
        err.responseJSON?.error || err.responseText || err.toString()
      );
    }
  }, [searchQuery]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  console.log({ searchResults });

  // when page updates, load results for page
  useCallback(async () => {
    try {
    } catch (err) {
      console.error(err);
    }
  }, [page]);

  const tabScopedListing = getListing(
    searchResults,
    searchQuery.searchTerm,
    searchQuery.sort,
    activeTab as SearchScope,
    navigate
  );

  const resultCount =
    tabScopedListing.length === SEARCH_PAGE_SIZE
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
    navigate(`/search?${newSearchQuery.toUrlParams()}`);
  };

  const handleSearchAllCommunities = () => {
    const newSearchQuery = SearchQuery.fromUrlParams(
      Object.fromEntries(searchParams.entries())
    );
    newSearchQuery.chainScope = undefined;
    navigate(`/search?${newSearchQuery.toUrlParams()}`);
  };

  const handleScroll = () => {
    if (bottomEl.current) {
      const offset = 0;
      const top = bottomEl.current.getBoundingClientRect().top;
      const isInViewport =
        top + offset >= 0 && top - offset <= window.innerHeight;
      if (isInViewport) {
        setPage(page + 1);
      }
    }
  };

  return !app.search.getByQuery(searchQuery)?.loaded ? (
    <PageLoading />
  ) : (
    <Sublayout onScroll={handleScroll}>
      <div className="SearchPage">
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
            {resultCount} matching '{searchQuery.searchTerm}'{' '}
            {getCaptionScope()}
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
    </Sublayout>
  );
};

export default SearchPage;
