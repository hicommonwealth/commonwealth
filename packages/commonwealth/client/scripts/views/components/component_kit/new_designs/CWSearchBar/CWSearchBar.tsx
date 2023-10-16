import React, { FC, ChangeEvent, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type { NavigateOptions, To } from 'react-router';

import app from '../../../../../state';
import { ComponentType } from '../../types';
import { getClasses } from '../../helpers';
import SearchQuery from '../../../../../models/SearchQuery';
import { notifyError } from '../../../../../controllers/app/notifications';
import { useCommonNavigate } from '../../../../../navigation/helpers';
import useSearchResults from '../../../../../hooks/useSearchResults';
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
  setRoute: (url: To, options?: NavigateOptions, prefix?: null | string) => void
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
  const chainId = app.activeChainId() || 'all_chains';
  const chain = app.config.chains.getById(chainId);
  const [searchTerm, setSearchTerm] = useState('');
  const { searchResults } = useSearchResults(searchTerm, [
    'threads',
    'replies',
    chainId === 'all_chains' ? 'communities' : null,
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
      chainScope: showTag ? chainId : 'all_chains',
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
          ComponentType.Searchbar
        )}
      >
        <MagnifyingGlass
          className="magnifyingGlass"
          weight="regular"
          size={24}
          onClick={handleGoToSearchPage}
        />
        {showTag && !!chain && (
          <CWTag
            label={chain.name}
            type="input"
            community={chain}
            onClick={() => setShowTag(false)}
          />
        )}
        <div
          className={getClasses(
            { inputElement: true },
            ComponentType.Searchbar
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
