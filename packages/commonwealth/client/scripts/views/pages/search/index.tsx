import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { capitalize } from 'lodash';

import 'pages/search/index.scss';

import type { SearchScope } from 'models/SearchQuery';

import app from 'state';

import { SearchContentType } from 'types';
import { SearchScope, SearchSort } from 'models/SearchQuery';
import type { MinimumProfile as Profile } from 'models';

import { AddressInfo, SearchQuery } from 'models';
import { SearchSort } from 'models/SearchQuery';

import { pluralize } from 'helpers';
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

  const [searchQuery, setSearchQuery] = useState<SearchQuery>(
    SearchQuery.fromUrlParams(Object.fromEntries(searchParams.entries()))
  );
  const [activeTab, setActiveTab] = useState<SearchScope>(
    searchQuery.getSearchScope()[0]
  );
  const [searchResults, setSearchResults] = useState({});

  useEffect(() => {
    const search = async () => {
      try {
        const response = await app.search.search(searchQuery);

  return (
    <div className="community-result-row" onClick={onSelect}>
      <CommunityLabel {...params} />
    </div>
  );
};

const getMemberResult = (addr) => {
  const profile: Profile = app.newProfiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null, null);

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
  }, [searchQuery]);

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
                onClick={() => {
                  setSearchQuery(
                    (prevState) =>
                      ({ ...prevState, chainScope: undefined } as SearchQuery)
                  );
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
                  setSearchQuery(
                    (prevState) =>
                      ({
                        ...prevState,
                        sort: SearchSort[o.value],
                      } as SearchQuery)
                  );
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
