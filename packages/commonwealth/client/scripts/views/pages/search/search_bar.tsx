import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useDebounce } from 'usehooks-ts';
import { isEmpty } from 'lodash';

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

export const SearchBar = () => {
  const navigate = useCommonNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<
    Record<string, Array<any>>
  >({});

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
    if (searchTerm.length > 3) {
      const newQuery = new SearchQuery(searchTerm, {
        isSearchPreview: false,
        chainScope: app.activeChainId(),
      });

      if (!newQuery.searchTerm || !newQuery.searchTerm.toString().trim()) {
        notifyError('Enter a valid search term');
      }

      // app.search.addToHistory(newQuery);
      const searchUrl = `/search?${newQuery.toUrlParams()}`;
      // console.log(searchUrl);
      navigate(searchUrl);
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
          onInput={handleChange}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleGoToSearchPage();
            }
          }}
        />
        {searchTerm?.length > 0 && (
          <div className="clear-icon">
            <CWIconButton
              iconName="close"
              onClick={() => {
                setSearchTerm('');
                setSearchResults({});
              }}
            />
          </div>
        )}
        {!isEmpty(searchResults) && showDropdown && (
          <div className="search-results-dropdown">
            {Object.values(searchResults).flat(1).length > 0 ? (
              <div className="previews-section">
                {Object.entries(searchResults).map(([k, v]) => {
                  if (k === SearchScope.Threads && v.length > 0) {
                    return (
                      <div
                        className="preview-section"
                        key={k}
                        onClick={() => console.log('in')}
                      >
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
