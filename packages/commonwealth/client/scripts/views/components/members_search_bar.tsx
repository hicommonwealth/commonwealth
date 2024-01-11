import React from 'react';

import { CWIconButton } from './component_kit/cw_icon_button';
import { getClasses } from './component_kit/helpers';

import 'pages/search/search_bar.scss';

type MembersSearchBarProps = {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  communityName: string;
};

export const MembersSearchBar = ({
  searchTerm,
  setSearchTerm,
  communityName,
}: MembersSearchBarProps) => {
  return (
    <div className="SearchBar members-search-bar">
      <div className="search-and-icon-container">
        <div className="search-icon">
          <CWIconButton iconName="search" />
        </div>
        <input
          className={getClasses<{ isClearable: boolean }>({
            isClearable: searchTerm?.length > 0,
          })}
          placeholder={`Search members in ${communityName}`}
          value={searchTerm}
          autoComplete="off"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm?.length > 0 && (
          <div className="clear-icon">
            <CWIconButton iconName="close" onClick={() => setSearchTerm('')} />
          </div>
        )}
      </div>
    </div>
  );
};
