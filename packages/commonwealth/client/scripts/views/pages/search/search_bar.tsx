import React, { useEffect, useState } from 'react';
import type { NavigateOptions, To } from 'react-router';

import 'pages/search/search_bar.scss';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import SearchQuery, { SearchScope } from 'models/SearchQuery';
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
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CommunityResult,
  MemberResult,
  ReplyResult,
  ThreadResult,
} from './helpers';

const MIN_SEARCH_TERM_LENGTH = 4;
const NUM_RESULTS_PER_SECTION = 2;

let resetTimer = null;

const SEARCH_URLS: Record<SearchScope, string> = {
  [SearchScope.Threads]: '/api/threads',
  [SearchScope.Members]: '/api/profiles',
  [SearchScope.Communities]: '/api/chains',
  [SearchScope.Replies]: '/api/comments',
  [SearchScope.Proposals]: '',
  [SearchScope.All]: '',
};

// fetches a single page of results for the search scope
async function searchInScope<T>(
  chain: string,
  searchScope: SearchScope,
  searchTerm: string
): Promise<T[]> {
  try {
    const urlParams = {
      chain: chain || 'all_chains',
      search: searchTerm,
      limit: NUM_RESULTS_PER_SECTION.toString(),
      page: 1,
      order_by: 'rank',
      order_direction: 'DESC',
    };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(urlParams)) {
      q.set(k, v.toString());
    }
    const url = SEARCH_URLS[searchScope];
    if (!url) {
      throw new Error(`could not get url for search scope: ${searchScope}`);
    }
    const { data } = await axios.get<{ result: { results } }>(
      `${url}?${q.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return data.result.results as T[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

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
  const chain = app.activeChainId() || 'all_chains';

  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const resetSearchBar = () => {
    setSearchTerm('');
  };

  const handleGoToSearchPage = () => {
    const searchQuery = new SearchQuery(searchTerm, {
      isSearchPreview: false,
      chainScope: chain,
    });
    goToSearchPage(searchQuery, navigate);
  };

  const handleInputChange = (e) => {
    const value = e.target.value?.toLowerCase();
    setSearchTerm(value);
  };

  const fetchSearchResults = async () => {
    const [
      threadResults,
      replyResults,
      communityResults,
      memberResults,
    ] = await Promise.all([
      searchInScope<ThreadResult>(
        chain,
        SearchScope.Threads,
        debouncedSearchTerm
      ),
      searchInScope<ReplyResult>(
        chain,
        SearchScope.Replies,
        debouncedSearchTerm
      ),
      searchInScope<CommunityResult>(
        chain,
        SearchScope.Communities,
        debouncedSearchTerm
      ),
      searchInScope<MemberResult>(
        chain,
        SearchScope.Members,
        debouncedSearchTerm
      ),
    ]);
    return {
      [SearchScope.Threads]: threadResults,
      [SearchScope.Replies]: replyResults,
      [SearchScope.Communities]: communityResults,
      [SearchScope.Members]: memberResults,
    };
  };

  const isValidSearchTerm =
    debouncedSearchTerm.length >= MIN_SEARCH_TERM_LENGTH;

  const { data: searchResults, refetch } = useQuery({
    queryKey: [
      'searchBar',
      {
        debouncedSearchTerm,
        chain,
      },
    ],
    queryFn: fetchSearchResults,
    enabled: isValidSearchTerm,
  });

  const showDropdown =
    searchTerm.length > 0 && Object.keys(searchResults || {}).length > 0;

  // when debounced search term changes, refetch
  useEffect(() => {
    if (!isValidSearchTerm) {
      return;
    }
    refetch();
  }, [isValidSearchTerm, debouncedSearchTerm, refetch]);

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
