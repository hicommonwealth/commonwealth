import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import type { NavigateOptions, To } from 'react-router';
import { useDebounce } from 'usehooks-ts';

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

export const SearchBar = () => {
  const navigate = useCommonNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] =
    useState<Record<string, Array<any>>>();

  const debouncedValue = useDebounce<string>(searchTerm, 500);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    const search = async () => {
      try {
        const response = await app.search.search(
          new SearchQuery(searchTerm, {
            isSearchPreview: true,
            chainScope: app.activeChainId(),
          })
        );

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

    if (debouncedValue.length > 0) {
      search();
    }
  }, [debouncedValue]);

  const handleGoToSearchPage = () => {
    goToSearchPage(
      new SearchQuery(searchTerm, {
        isSearchPreview: false,
        chainScope: app.activeChainId(),
      }),
      navigate
    );
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
          onBlur={() => setShowDropdown(false)}
          onInput={handleChange}
          onKeyUp={(e) => {
            if (e.key === 'Enter' && searchTerm.length > 3) {
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
                        {v.map((res, i) => (
                          <SearchBarThreadPreviewRow
                            key={i}
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
                            key={i}
                            searchResult={res}
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
                            key={i}
                            searchResult={res}
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
