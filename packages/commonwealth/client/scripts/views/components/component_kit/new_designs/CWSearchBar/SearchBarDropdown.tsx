import React, { FC } from 'react';

import { SearchScope } from '../../../../../models/SearchQuery';
import { CWDivider } from '../../cw_divider';
import { CWText } from '../../cw_text';
import { SearchBarCommentPreviewRow } from './SearchBarCommentPreviewRow';
import { SearchBarCommunityPreviewRow } from './SearchBarCommunityPreviewRow';
import { SearchBarMemberPreviewRow } from './SearchBarMemberPreviewRow';
import { SearchBarThreadPreviewRow } from './SearchBarThreadPreviewRow';

import { SearchUserProfilesView } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { SearchResults } from '../../../../../hooks/useSearchResults';
import { SearchChainsResponse } from '../../../../../state/api/chains/searchChains';
import { SearchCommentsResponse } from '../../../../../state/api/comments/searchComments';
import { SearchThreadsResponse } from '../../../../../state/api/threads/searchThreads';
import './SearchBarDropdown.scss';

interface SearchBarPreviewSectionProps {
  searchResults:
    | SearchThreadsResponse['results']
    | SearchCommentsResponse['results']
    | SearchChainsResponse['results']
    | z.infer<typeof SearchUserProfilesView>[];
  searchTerm: string;
  searchScope: SearchScope;
  onSearchItemClick?: () => void;
}

interface SearchBarDropdownProps {
  searchTerm: string;
  searchResults: SearchResults;
  onSearchItemClick?: () => void;
}

/* eslint-disable react/no-multi-comp */
const SearchBarPreviewSection: FC<SearchBarPreviewSectionProps> = ({
  searchResults,
  searchTerm,
  searchScope,
  onSearchItemClick,
}) => {
  const sectionTitles = {
    [SearchScope.Threads]: 'Threads',
    [SearchScope.Replies]: 'Comments',
    [SearchScope.Communities]: 'Communities',
    [SearchScope.Members]: 'Members',
  };

  const PreviewRowComponentMap = {
    [SearchScope.Threads]: SearchBarThreadPreviewRow,
    [SearchScope.Replies]: SearchBarCommentPreviewRow,
    [SearchScope.Communities]: SearchBarCommunityPreviewRow,
    [SearchScope.Members]: SearchBarMemberPreviewRow,
  };

  const PreviewRowComponent = PreviewRowComponentMap[searchScope];

  if (!PreviewRowComponent || searchResults.length === 0) {
    return null;
  }

  return (
    <div className="preview-section">
      <div className="section-header">
        <CWText type="b2" className="section-header-text">
          {sectionTitles[searchScope]}
        </CWText>
        <CWDivider />
      </div>
      {searchResults.map((res: any, i: number) => (
        <PreviewRowComponent
          key={i}
          searchResult={res}
          searchTerm={searchTerm}
          onSearchItemClick={onSearchItemClick}
        />
      ))}
    </div>
  );
};

export const SearchBarDropdown: FC<SearchBarDropdownProps> = ({
  searchTerm,
  searchResults,
  onSearchItemClick,
}) => {
  const showResults =
    searchTerm.length >= 3 && Object.values(searchResults).flat(1).length > 0;

  return (
    <div className="SearchBarDropdown">
      {showResults && (
        <div className="previews-section">
          {Object.entries(searchResults).map(([scope, results]) => (
            <SearchBarPreviewSection
              key={scope}
              searchResults={results}
              searchTerm={searchTerm}
              searchScope={scope as SearchScope}
              onSearchItemClick={onSearchItemClick}
            />
          ))}
        </div>
      )}
      {!showResults && searchTerm.length >= 3 && (
        <div className="no-results">
          <CWText type="b2">No results found</CWText>
        </div>
      )}
      {!showResults && searchTerm.length < 3 && (
        <div className="no-results">
          <CWText type="b2">Search term requires 3 or more characters</CWText>
        </div>
      )}
    </div>
  );
};
