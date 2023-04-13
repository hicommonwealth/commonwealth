import React, { useEffect, useState } from 'react';
import type { NavigateOptions, To } from 'react-router';

import 'pages/search/search_bar.scss';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import {
  SearchBarCommentPreviewRow,
  SearchBarCommunityPreviewRow,
  SearchBarMemberPreviewRow,
  SearchBarThreadPreviewRow,
} from './search_bar_components';
import { useCommonNavigate } from 'navigation/helpers';
import { useDebounce } from 'usehooks-ts';

const MIN_SEARCH_TERM_LENGTH = 4;
const NUM_RESULTS_PER_SECTION = 2;

let resetTimer = null;

const goToSearchPage = (
  query: SearchQuery,
  setRoute: (url: To, options?: NavigateOptions, prefix?: null | string) => void
) => {
  if (!query.searchTerm || !query.searchTerm.toString().trim()) {
    notifyError('Enter a valid search term');
    return;
  }

  if (query.searchTerm.length < MIN_SEARCH_TERM_LENGTH) {
    notifyError(`Query must be at least ${MIN_SEARCH_TERM_LENGTH} characters`);
    return;
  }

  app.search.addToHistory(query);

  setRoute(`/search?${query.toUrlParams()}`);
};

export const SearchBar = () => {
  const navigate = useCommonNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<
    Record<string, Array<any>>
  >({});

  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const showDropdown =
    Object.keys(searchResults || {}).length > 0 && searchTerm.length > 0;

  const resetSearchBar = () => {
    setSearchTerm('');
    setSearchResults({});
  };

  const handleGoToSearchPage = () => {
    const searchQuery = new SearchQuery(searchTerm, {
      isSearchPreview: false,
      chainScope: app.activeChainId(),
    });

    goToSearchPage(searchQuery, navigate);
  };

  const handleInputChange = (e) => {
    const value = e.target.value?.toLowerCase();
    setSearchTerm(value);
  };

  const handleGetSearchPreview = async (value: string) => {
    const searchQuery = new SearchQuery(value, {
      isSearchPreview: true,
      chainScope: app.activeChainId() || 'all_chains',
    });

    try {
      await app.search.search(searchQuery);
      const searchResponse = app.search.getByQuery(searchQuery)?.results;

      const results = searchResponse
        ? Object.fromEntries(
            Object.entries(searchResponse).map(([k, v]) => [
              k,
              v.slice(0, NUM_RESULTS_PER_SECTION),
            ])
          )
        : {};

      setSearchResults(results);
      app.search.addToHistory(searchQuery);
    } catch (err) {
      setSearchResults({});

      notifyError(
        err.responseJSON?.error || err.responseText || err.toString()
      );
    }
  };

  // when debounced search term changes, fetch search results
  useEffect(() => {
    clearTimeout(resetTimer);
    if (debouncedSearchTerm?.length >= MIN_SEARCH_TERM_LENGTH) {
      handleGetSearchPreview(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <div
      className="SearchBar"
      onBlur={() => {
        // give time for child click events to
        // fire before resetting the search bar
        if (!resetTimer) {
          resetTimer = setTimeout(() => {
            resetSearchBar();
            resetTimer = null;
          }, 300);
        }
      }}
    >
      <div className="search-and-icon-container">
        <div className="search-icon">
          <CWIconButton iconName="search" onClick={handleGoToSearchPage} />
        </div>
        <input
          className={getClasses<{ isClearable: boolean }>({
            isClearable: searchTerm?.length > 0,
          })}
          placeholder={
            app.activeChainId()
              ? `Search ${app.activeChainId()}`
              : 'Search Common'
          }
          value={searchTerm}
          autoComplete="off"
          onChange={handleInputChange}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleGoToSearchPage();
            }
          }}
        />
        {searchTerm?.length > 0 && (
          <div className="clear-icon">
            <CWIconButton iconName="close" onClick={() => setSearchTerm('')} />
          </div>
        )}
        {showDropdown && (
          <div className="search-results-dropdown">
            {Object.values(searchResults).flat(1).length > 0 ? (
              <div className="previews-section">
                {Object.entries(searchResults).map(([k, v]) => {
                  if (k === SearchScope.Threads && v.length > 0) {
                    return (
                      <div className="preview-section" key={k}>
                        <div className="section-header">
                          <CWText
                            type="caption"
                            className="section-header-text"
                          >
                            Threads
                          </CWText>
                          <CWDivider />
                        </div>
                        {v.map((res, i) => (
                          <SearchBarThreadPreviewRow
                            searchResult={res}
                            searchTerm={searchTerm}
                            key={i}
                          />
                        ))}
                      </div>
                    );
                  } else if (k === SearchScope.Replies && v.length > 0) {
                    return (
                      <div className="preview-section" key={k}>
                        <div className="section-header">
                          <CWText
                            type="caption"
                            className="section-header-text"
                          >
                            Comments
                          </CWText>
                          <CWDivider />
                        </div>
                        {v.map((res, i) => (
                          <SearchBarCommentPreviewRow
                            key={i}
                            searchResult={res}
                            searchTerm={searchTerm}
                          />
                        ))}
                      </div>
                    );
                  } else if (k === SearchScope.Communities && v.length > 0) {
                    return (
                      <div className="preview-section" key={k}>
                        <div className="section-header">
                          <CWText
                            type="caption"
                            className="section-header-text"
                          >
                            Communities
                          </CWText>
                          <CWDivider />
                        </div>
                        {v.map((res, i) => (
                          <SearchBarCommunityPreviewRow
                            searchResult={res}
                            key={i}
                          />
                        ))}
                      </div>
                    );
                  } else if (k === SearchScope.Members && v.length > 0) {
                    return (
                      <div className="preview-section" key={k}>
                        <div className="section-header">
                          <CWText
                            type="caption"
                            className="section-header-text"
                          >
                            Members
                          </CWText>
                          <CWDivider />
                        </div>
                        {v.map((res, i) => (
                          <SearchBarMemberPreviewRow
                            searchResult={res}
                            key={i}
                          />
                        ))}
                      </div>
                    );
                  } else {
                    return null;
                  }
                })}
              </div>
            ) : (
              <CWText type="caption" className="no-results-text">
                No Results
              </CWText>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
