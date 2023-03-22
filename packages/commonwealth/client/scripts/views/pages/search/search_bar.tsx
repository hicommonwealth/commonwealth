import React, { useState } from 'react';
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

const goToSearchPage = (
  query: SearchQuery,
  setRoute: (url: To, options?: NavigateOptions, prefix?: null | string) => void
) => {
  if (!query.searchTerm || !query.searchTerm.toString().trim()) {
    notifyError('Enter a valid search term');
    return;
  }

  if (query.searchTerm.length < 4) {
    notifyError('Query must be at least 4 characters');
  }

  app.search.addToHistory(query);

  setRoute(`/search?${query.toUrlParams()}`);
};

// FIX comments problem with rendering
// FIX hitting enter
// FIX communities should be visible when no scope

export const SearchBar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] =
    useState<Record<string, Array<any>>>();
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useCommonNavigate();

  // const historyList = app.search.getHistory().map((previousQuery) => (
  //   <div
  //     className="history-row"
  //     onClick={() => {
  //       searchTerm = previousQuery.searchTerm;
  //       getSearchPreview(previousQuery, this);
  //     }}
  //   >
  //     {previousQuery.searchTerm}
  //     <CWIconButton
  //       iconName="close"
  //       onClick={(e) => {
  //         e.stopPropagation();
  //         app.search.removeFromHistory(previousQuery);
  //       }}
  //     />
  //   </div>
  // ));

  const handleGetSearchPreview = async (value: string) => {
    const searchQuery = new SearchQuery(value, {
      isSearchPreview: true,
      chainScope: app.activeChainId(),
    });

    try {
      await app.search.search(searchQuery);
      const searchResponse = app.search.getByQuery(searchQuery)?.results;

      const results = searchResponse
        ? Object.fromEntries(
            Object.entries(searchResponse).map(([k, v]) => [k, v.slice(0, 2)])
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

  const handleGoToSearchPage = () => {
    if (searchTerm?.length < 3) {
      return;
    }

    const searchQuery = new SearchQuery(searchTerm, {
      isSearchPreview: false,
      chainScope: app.activeChainId(),
    });

    goToSearchPage(searchQuery, navigate);
  };

  const handleInputChange = (e) => {
    const value = e.target.value?.toLowerCase();
    setSearchTerm(value);

    if (value?.length > 3) {
      handleGetSearchPreview(value);
    }
  };

  return (
    <div className="SearchBar">
      <div className="search-and-icon-container">
        <div className="search-icon">
          <CWIconButton iconName="search" onClick={handleGoToSearchPage} />
        </div>
        <input
          className={getClasses<{ isClearable: boolean }>({
            isClearable: searchTerm?.length > 0,
          })}
          placeholder="Search Common"
          value={searchTerm}
          autoComplete="off"
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            setTimeout(() => {
              setShowDropdown(false);
            }, 500); // hack to prevent the dropdown closing too quickly on click
          }}
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
        {searchResults && showDropdown && (
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
                        {v.map((res) => (
                          <SearchBarThreadPreviewRow
                            searchResult={res}
                            searchTerm={searchTerm}
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
                        {v.map((res) => (
                          <SearchBarCommentPreviewRow
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
                        {v.map((res) => (
                          <SearchBarCommunityPreviewRow searchResult={res} />
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
                        {v.map((res) => (
                          <SearchBarMemberPreviewRow searchResult={res} />
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
            {/* {historyList.length > 0 && (
                <div className="history-section">
                  <CWText
                    type="caption"
                    fontWeight="medium"
                    className="search-history-header"
                  >
                    Search History
                  </CWText>
                  {historyList}
                </div>
              )} */}
          </div>
        )}
      </div>
    </div>
  );
};
