import React, { FC, ChangeEvent, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type { NavigateOptions, To } from 'react-router';

import { ComponentType } from '../types';
import { CWTag } from './cw_tag';
import { IconName } from '../cw_icons/cw_icon_lookup';
import { ValidationStatus } from '../cw_validation_text';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import SearchQuery, { SearchScope } from '../../../../models/SearchQuery';
import { CWDivider } from '../cw_divider';
import {
  SearchBarCommentPreviewRow,
  SearchBarCommunityPreviewRow,
  SearchBarMemberPreviewRow,
  SearchBarThreadPreviewRow,
} from '../../../../../scripts/views/pages/search/search_bar_components';
import app from '../../../../../scripts/state';
import { notifyError } from '../../../../controllers/app/notifications';
import { useCommonNavigate } from '../../../../../scripts/navigation/helpers';
import useSearchResults from '../../../../../scripts/hooks/useSearchResults';

import 'components/component_kit/new_designs/CWSearchBar.scss';

type BaseSearchBarProps = {
  autoComplete?: string;
  autoFocus?: boolean;
  containerClassName?: string;
  defaultValue?: string | number;
  value?: string | number;
  iconLeft?: IconName;
  iconLeftonClick?: () => void;
  inputValidationFn?: (value: string) => [ValidationStatus, string] | [];
  label?: string | React.ReactNode;
  maxLength?: number;
  name?: string;
  onInput?: (e) => void;
  onenterkey?: (e) => void;
  onClick?: (e) => void;
  placeholder?: string;
  tabIndex?: number;
  manualStatusMessage?: string;
  manualValidationStatus?: ValidationStatus;
};

type InputStyleProps = {
  inputClassName?: string;
  disabled?: boolean;
};

type InputInternalStyleProps = {
  hasLeftIcon?: boolean;
};

type SearchBarProps = BaseSearchBarProps &
  InputStyleProps &
  InputInternalStyleProps &
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

type SectionHeaderProps = {
  header: string;
};

const SectionHeader: FC<SectionHeaderProps> = ({ header }) => {
  return (
    <div className="section-header">
      <CWText type="caption" className="section-header-text">
        {header}
      </CWText>
      <CWDivider />
    </div>
  );
};

export const CWSearchBar: FC<SearchBarProps> = ({ disabled, placeholder }) => {
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

  const showDropdown =
    searchTerm.length > 0 && Object.keys(searchResults || {}).length > 0;

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
        className={getClasses<InputStyleProps & InputInternalStyleProps>(
          {
            disabled,
          },
          ComponentType.Searchbar
        )}
      >
        <MagnifyingGlass
          className={getClasses(
            { magnifyingGlass: true },
            ComponentType.Searchbar
          )}
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
      {showDropdown && (
        <div className="ListBox">
          {Object.values(searchResults).flat(1).length > 0 ? (
            <div className="previews-section">
              {Object.entries(searchResults).map(([k, v]: [any, any]) => {
                if (k === SearchScope.Threads && v.length > 0) {
                  return (
                    <div className="preview-section" key={k}>
                      <SectionHeader header="Threads" />
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
                      <SectionHeader header="Comments" />
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
                      <SectionHeader header="Communities" />
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
                      <SectionHeader header="Members" />
                      {v.map((res, i) => (
                        <SearchBarMemberPreviewRow key={i} searchResult={res} />
                      ))}
                    </div>
                  );
                } else {
                  return null;
                }
              })}
            </div>
          ) : (
            <div className="no-results">
              <CWText type="b2">No results found</CWText>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
