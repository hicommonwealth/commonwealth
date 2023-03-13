import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { capitalize, isEqual } from 'lodash';

import 'pages/search/index.scss';

import type { SearchScope } from 'models/SearchQuery';

import app from 'state';
import { pluralize } from 'helpers';
import { SearchSort } from 'models/SearchQuery';
import { SearchQuery } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import ErrorPage from '../error';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { useCommonNavigate } from 'navigation/helpers';
import { getListing } from './helpers';

const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const SearchPage = () => {
  const navigate = useCommonNavigate();
  const [searchParams, _] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SearchScope>();
  const [errorText, setErrorText] = useState('');
  const [pageCount, setPageCount] = useState<number>();
  const [shouldRefreshResults, setShouldRefreshResults] = useState(false);
  const [results, setResults] = useState({});
  const [searchQuery,] = useState<SearchQuery>(
    SearchQuery.fromUrlParams(
      Object.fromEntries(searchParams.entries())
    )
  );
  const [scope,] = useState<string>(
    app.isCustomDomain() ? app.customDomainId() : searchQuery.chainScope
  );
  console.log(searchQuery, scope);

  if (!app.search.isValidQuery(searchQuery)) {
    setErrorText(
      'Please enter a query longer than 3 characters to begin searching'
    );
  }

  const search = async () => {
    try {
      await app.search.search(searchQuery);
    } catch (err) {
      setResults({});
      notifyError(
        err.responseJSON?.error || err.responseText || err.toString()
      );
    }

    setResults(app.search.getByQuery(searchQuery).results);
    app.search.addToHistory(searchQuery);
  };

  // re-fetch results for new search if search term or URI has changed
  if (!isEqual(searchQuery, searchQuery) || shouldRefreshResults) {
    setShouldRefreshResults(false);
    setResults({});
    search();
    return <PageLoading />;
  }

  if (!app.search.getByQuery(searchQuery)?.loaded) {
    return <PageLoading />;
  }

  if (!activeTab) {
    setActiveTab(searchQuery.getSearchScope()[0]);
  }

  if (!pageCount) {
    setPageCount(1);
  }

  const getTab = (searchScope: SearchScope) => {
    return (
      <CWTab
        label={searchScope}
        isSelected={activeTab === searchScope}
        onClick={() => {
          setPageCount(1);
          setActiveTab(searchScope);
        }}
      />
    );
  };

  const tabs = searchQuery.getSearchScope().map(getTab);

  const tabScopedListing = getListing(
    results,
    searchQuery.searchTerm,
    pageCount,
    searchQuery.sort,
    activeTab,
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
    if (scope) {
      return `in ${capitalize(scope)}.`;
    } else if (app.isCustomDomain()) {
      return '';
    } else {
      return 'across all communities.';
    }
  };

  return errorText?.length > 0 ? (
    <ErrorPage message={errorText} />
  ) : (
    <Sublayout>
      <div className="SearchPage">
        <>
          {!app.search.getByQuery(searchQuery)?.loaded ? (
            <CWSpinner size="xl" />
          ) : (
            <div className="search-results">
              <CWTabBar>{tabs}</CWTabBar>
              <CWText isCentered className="search-results-caption">
                {resultCount} matching '{searchQuery.searchTerm}'{' '}
                {getCaptionScope()}
                {scope && !app.isCustomDomain() && (
                  <a
                    href="#"
                    className="search-all-communities"
                    onClick={() => {
                      searchQuery.chainScope = undefined;
                      navigate(`/search?${searchQuery.toUrlParams()}`);
                      setTimeout(() => {
                        setShouldRefreshResults(true);
                      }, 0);
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
                      setTimeout(() => {
                        setShouldRefreshResults(true);
                      }, 0);
                    }}
                  />
                </div>
              )}
              <div className="search-results-list">{tabScopedListing}</div>
            </div>
          )}
        </>
      </div>
    </Sublayout>
  );
};

export default SearchPage;
