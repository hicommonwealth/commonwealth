import { MagnifyingGlass } from '@phosphor-icons/react';
import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react';
import type { NavigateOptions, To } from 'react-router';

import { CWText } from 'views/components/component_kit/cw_text';
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
  onSearchItemClick?: () => void;
};

type InputStyleProps = {
  disabled?: boolean;
  size?: 'small' | 'normal';
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
  size = 'normal',
  placeholder = size === 'small' ? 'Search' : 'Search Common',
  onSearchItemClick,
}) => {
  const inputRef = useRef<HTMLInputElement>();
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

  //on mobile, focus the input when the component (search modal) mounts
  useEffect(() => {
    if (size === 'small') {
      inputRef?.current?.focus?.();
    }
  }, [size]);

  const resetSearchBar = () => setSearchTerm('');

  const handleOnInput = (e: ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleOnKeyUp = (e) => {
    if (e.key === 'Enter') {
      handleGoToSearchPage();

      if (size === 'small') {
        onSearchItemClick?.();
      }
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
      className={getClasses({ container: true, size }, ComponentType.Searchbar)}
      onBlur={handleOnBlur}
    >
      <div
        className={getClasses<InputStyleProps>(
          {
            disabled,
            size,
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
            { inputElement: true, size },
            ComponentType.Searchbar,
          )}
        >
          <input
            ref={inputRef}
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
          onSearchItemClick={onSearchItemClick}
        />
      )}

      {size === 'small' && !searchTerm && (
        <CWText type="b2" className="mobile-empty">
          Start typing to see results
        </CWText>
      )}
    </div>
  );
};
