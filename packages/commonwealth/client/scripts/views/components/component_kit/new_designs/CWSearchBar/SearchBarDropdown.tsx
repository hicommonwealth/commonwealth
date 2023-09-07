import React, { FC } from 'react';

import { SearchScope } from '../../../../../models/SearchQuery';
import { CWText } from '../../cw_text';
import { CWDivider } from '../../cw_divider';
import { SearchBarCommentPreviewRow } from './SearchBarCommentPreviewRow';
import { SearchBarCommunityPreviewRow } from './SearchBarCommunityPreviewRow';
import { SearchBarMemberPreviewRow } from './SearchBarMemberPreviewRow';
import { SearchBarThreadPreviewRow } from './SearchBarThreadPreviewRow';

import './SearchBarDropdown.scss';

interface SearchBarPreviewSectionProps {
  searchResults: any;
  searchTerm: string;
  searchScope: SearchScope;
}

interface SearchBarDropdownProps {
  searchTerm: string;
  searchResults: any;
}

const SearchBarPreviewSection: FC<SearchBarPreviewSectionProps> = ({
  searchResults,
  searchTerm,
  searchScope,
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
        />
      ))}
    </div>
  );
};

export const SearchBarDropdown: FC<SearchBarDropdownProps> = ({
  searchTerm,
  searchResults,
}) => {
  const showResults =
    searchTerm.length > 0 && Object.values(searchResults).flat(1).length > 0;

  return (
    <div className="SearchBarDropdown">
      {showResults ? (
        <div className="previews-section">
          {Object.entries(searchResults).map(([scope, results]) => (
            <SearchBarPreviewSection
              key={scope}
              searchResults={results}
              searchTerm={searchTerm}
              searchScope={scope as SearchScope}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <CWText type="b2">No results found</CWText>
        </div>
      )}
    </div>
  );
};
