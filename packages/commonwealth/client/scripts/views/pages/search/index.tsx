import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const SearchPage = () => {
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState({});
  const searchQuery = useMemo(
    () => SearchQuery.fromUrlParams(Object.fromEntries(searchParams.entries())),
    [searchParams]
  );
  const [activeTab, setActiveTab] = useState<SearchScope>(
    searchQuery.getSearchScope()[0]
  );

  const handleSearch = useCallback(async () => {
    try {
      const response = await app.search.search(searchQuery);

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

  return !app.search.getByQuery(searchQuery)?.loaded ? (
    <PageLoading />
  ) : (
    <Sublayout>
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
            {searchQuery.chainScope && !app.isCustomDomain() && (
              <a
                href="#"
                className="search-all-communities"
                onClick={handleSearchAllCommunities}
              >
                Search all communities?
              </a>
            )}
          </CWText>
          {tabScopedListing.length > 0 && activeTab === 'Threads' && (
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
          <div className="search-results-list">{tabScopedListing}</div>
        </div>
      </div>
    </Sublayout>
  );
};

export default SearchPage;
