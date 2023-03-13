import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { capitalize } from 'lodash';

import 'pages/search/index.scss';

import type { SearchScope } from 'models/SearchQuery';

import app from 'state';
import { pluralize } from 'helpers';
import { SearchSort } from 'models/SearchQuery';
import { SearchQuery } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { useCommonNavigate } from 'navigation/helpers';
import { getListing } from './helpers';

const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const SearchPage = () => {
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();

  const searchQuery = SearchQuery.fromUrlParams(
    Object.fromEntries(searchParams.entries())
  );

  const scopeTabs = searchQuery.getSearchScope();

  const [activeTab, setActiveTab] = useState<SearchScope>(scopeTabs[0]);
  const [searchResults, setSearchResults] = useState({});

  useEffect(() => {
    const search = async () => {
      try {
        const response = await app.search.search(searchQuery);

        setSearchResults(
          Object.fromEntries(
            Object.entries(response.results).map(([k, v]) => [k, v.slice(0, 2)])
          )
        );
      } catch (err) {
        setSearchResults({});
        notifyError(
          err.responseJSON?.error || err.responseText || err.toString()
        );
      }
    };

    search();
  }, []);

  if (!app.search.getByQuery(searchQuery)?.loaded) {
    return <PageLoading />;
  }

  if (!activeTab) {
    setActiveTab(searchQuery.getSearchScope()[0]);
  }

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

  return (
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
                onClick={() => {
                  searchQuery.chainScope = undefined;
                  navigate(`/search?${searchQuery.toUrlParams()}`);
                }}
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
                initialValue={{
                  label: searchQuery.sort,
                  value: searchQuery.sort,
                }}
                options={[
                  { label: 'Best', value: 'Best' },
                  { label: 'Newest', value: 'Newest' },
                  { label: 'Oldest', value: 'Oldest' },
                ]}
                onSelect={(o) => {
                  searchQuery.sort = SearchSort[o.value];
                  navigate(`/search?${searchQuery.toUrlParams()}`);
                }}
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
