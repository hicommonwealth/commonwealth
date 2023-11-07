import React, { useMemo, useState } from 'react';
import type { NavigateOptions, To } from 'react-router';

import 'pages/search/search_bar.scss';

import { notifyError } from 'controllers/app/notifications';
import SearchQuery, { SearchScope } from 'models/SearchQuery';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useDebounce } from 'usehooks-ts';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';
import { useSearchChainsQuery } from '../../../../scripts/state/api/chains';
import { useSearchCommentsQuery } from '../../../../scripts/state/api/comments';
import { useSearchProfilesQuery } from '../../../../scripts/state/api/profiles';
import { useSearchThreadsQuery } from '../../../../scripts/state/api/threads';
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

const NUM_RESULTS_PER_SECTION = 2;

let resetTimer = null;

const goToSearchPage = (
  query: SearchQuery,
  setRoute: (
    url: To,
    options?: NavigateOptions,
    prefix?: null | string,
  ) => void,
) => {
  if (!query.searchTerm || !query.searchTerm.toString().trim()) {
    notifyError('Enter a valid search term');
    return;
  }

  app.search.addToHistory(query);

  setRoute(`/search?${query.toUrlParams()}`);
};

export const SearchBar = () => {
  const navigate = useCommonNavigate();
  const chainId = app.activeChainId() || 'all_communities';

  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const resetSearchBar = () => {
    setSearchTerm('');
  };

  const handleGoToSearchPage = () => {
    const searchQuery = new SearchQuery(searchTerm, {
      isSearchPreview: false,
      chainScope: chainId,
    });
    goToSearchPage(searchQuery, navigate);
    resetSearchBar();
  };

  const handleInputChange = (e) => {
    const value = e.target.value?.toLowerCase();
    setSearchTerm(value);
  };

  const sharedQueryOptions = {
    chainId,
    searchTerm: debouncedSearchTerm,
    limit: NUM_RESULTS_PER_SECTION,
    orderBy: APIOrderBy.CreatedAt,
    orderDirection: APIOrderDirection.Desc,
  };
  const queryEnabled = debouncedSearchTerm.length > 0;

  const { data: threadsData } = useSearchThreadsQuery({
    ...sharedQueryOptions,
    enabled: queryEnabled,
  });

  const { data: commentsData } = useSearchCommentsQuery({
    ...sharedQueryOptions,
    enabled: queryEnabled,
  });

  const { data: chainsData } = useSearchChainsQuery({
    ...sharedQueryOptions,
    enabled: queryEnabled,
  });

  const { data: profilesData } = useSearchProfilesQuery({
    ...sharedQueryOptions,
    includeRoles: false,
    enabled: queryEnabled,
  });

  const searchResults = useMemo(() => {
    return {
      [SearchScope.Threads]: threadsData?.pages?.[0]?.results || [],
      [SearchScope.Replies]: commentsData?.pages?.[0]?.results || [],
      [SearchScope.Communities]: chainsData?.pages?.[0]?.results || [],
      [SearchScope.Members]: profilesData?.pages?.[0]?.results || [],
    };
  }, [threadsData, chainsData, profilesData, commentsData]);

  const showDropdown =
    searchTerm.length > 0 && Object.keys(searchResults || {}).length > 0;

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
          placeholder={'Search Common'}
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
