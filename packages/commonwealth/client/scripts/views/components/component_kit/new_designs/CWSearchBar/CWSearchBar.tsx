import { MagnifyingGlass } from '@phosphor-icons/react';
import React, { ChangeEvent, FC, useState } from 'react';
import type { NavigateOptions, To } from 'react-router';

import { notifyError } from '../../../../../controllers/app/notifications';
import useSearchResults from '../../../../../hooks/useSearchResults';
import SearchQuery from '../../../../../models/SearchQuery';
import { useCommonNavigate } from '../../../../../navigation/helpers';
import app from '../../../../../state';
import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';
import { CWTag } from '../CWTag';
import { SearchBarDropdown } from './SearchBarDropdown';

import './CWSearchBar.scss';

type BaseSearchBarProps = {
  placeholder?: string;
};

type InputStyleProps = {
  disabled?: boolean;
};

type SearchBarProps = BaseSearchBarProps &
  InputStyleProps &
  React.HTMLAttributes<HTMLDivElement>;

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

export const CWSearchBar: FC<SearchBarProps> = ({
  disabled,
  placeholder = 'Search Common',
}) => {
  const navigate = useCommonNavigate();
  const [showTag, setShowTag] = useState(true);
  const communityId = showTag
    ? app.activeChainId() || 'all_communities'
    : 'all_communities';
  const community = app.config.chains.getById(communityId);
  const [searchTerm, setSearchTerm] = useState('');
  const { searchResults } = useSearchResults(searchTerm, [
    'threads',
    'replies',
    communityId === 'all_communities' ? 'communities' : null,
    'members',
  ]);

  const resetSearchBar = () => setSearchTerm('');

  const handleOnInput = (e: ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleOnKeyUp = (e) => {
    if (e.key === 'Enter') {
      handleGoToSearchPage();
    } else if (e.key === 'Escape') {
      resetSearchBar();
    }
  };

  const handleOnBlur = () => {
    // Give time for child click events to
    // fire before resetting the search bar
    if (!resetTimer) {
      resetTimer = setTimeout(() => {
        resetSearchBar();
        resetTimer = null;
      }, 300);
    }
  };

  const handleOnKeyDown = (e: any) => {
    if (e.key === 'Backspace' && searchTerm.length === 0) {
      setShowTag(false);
    }
  };

  const handleGoToSearchPage = () => {
    const searchQuery = new SearchQuery(searchTerm, {
      isSearchPreview: false,
      communityScope: showTag ? communityId : 'all_communities',
    });
    goToSearchPage(searchQuery, navigate);
    resetSearchBar();
  };

  return (
    <div
      className={getClasses({ container: true }, ComponentType.Searchbar)}
      onBlur={handleOnBlur}
    >
      <div
        className={getClasses<InputStyleProps>(
          {
            disabled,
          },
          ComponentType.Searchbar,
        )}
      >
        <MagnifyingGlass
          className="magnifyingGlass"
          weight="regular"
          size={24}
          onClick={handleGoToSearchPage}
        />
        {showTag && !!community && (
          <CWTag
            label={community.name}
            type="input"
            community={community}
            onClick={() => setShowTag(false)}
          />
        )}
        <div
          className={getClasses(
            { inputElement: true },
            ComponentType.Searchbar,
          )}
        >
          <input
            placeholder={placeholder}
            onInput={handleOnInput}
            onKeyUp={handleOnKeyUp}
            onKeyDown={handleOnKeyDown}
            disabled={disabled}
            value={searchTerm}
          />
        </div>
      </div>
      {searchTerm.length > 0 && (
        <SearchBarDropdown
          searchTerm={searchTerm}
          searchResults={searchResults}
        />
      )}
    </div>
  );
};
