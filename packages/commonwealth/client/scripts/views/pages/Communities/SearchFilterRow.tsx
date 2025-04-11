import { MagnifyingGlass } from '@phosphor-icons/react';
import clsx from 'clsx';
import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './SearchFilterRow.scss';

export enum ViewType {
  List = 'list',
  Cards = 'cards',
}

export interface FilterTag {
  label: string;
  onRemove: () => void;
  type?: string;
  id?: number;
}

export interface InlineFilter {
  type: 'select' | 'toggle' | 'sort';
  placeholder?: string;
  value: any;
  onChange: (value: any) => void;
  options: Array<{ value: string; label: string; fullLabel?: string }>;
  isClearable?: boolean;
  isSearchable?: boolean;
  label?: string;
  className?: string;
}

interface SearchFilterRowProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  _selectedViewType: ViewType;
  _onViewTypeChange: (viewType: ViewType) => void;
  _selectedSortOption: string;
  _onSortOptionChange: (option: string) => void;
  _showViewToggle: boolean;
  onFilterClick?: () => void;
  _communitiesCount: number;
  _isFilterDrawerOpen: boolean;
  filterTags?: FilterTag[];
  placeholder?: string;
  inlineFilters?: InlineFilter[];
}

const SearchFilterRow = ({
  searchValue,
  onSearchChange,
  _selectedViewType,
  _onViewTypeChange,
  _selectedSortOption,
  _onSortOptionChange,
  _showViewToggle,
  onFilterClick,
  _communitiesCount,
  _isFilterDrawerOpen,
  filterTags = [],
  placeholder = 'Search',
  inlineFilters = [],
}: SearchFilterRowProps) => {
  return (
    <div className="search-filter-container">
      <div className="search-filter-row">
        <div className="search-container">
          <CWTextInput
            value={searchValue}
            onInput={(e) => onSearchChange(e.target.value)}
            fullWidth
            placeholder={placeholder}
            iconLeft={<MagnifyingGlass size={24} weight="regular" />}
          />
        </div>

        <div className="right-side-controls">
          {inlineFilters.length > 0 && (
            <div className="inline-filters">
              {inlineFilters.map((filter, index) => {
                if (filter.type === 'select' || filter.type === 'sort') {
                  return (
                    <div
                      key={`inline-filter-${index}`}
                      className={clsx('inline-filter-select', filter.className)}
                    >
                      {filter.label && (
                        <span className="filter-label">{filter.label}</span>
                      )}
                      <CWSelectList
                        placeholder={filter.placeholder}
                        value={filter.value}
                        onChange={filter.onChange}
                        options={filter.options}
                        isClearable={filter.isClearable}
                        isSearchable={filter.isSearchable}
                      />
                    </div>
                  );
                }
                if (filter.type === 'toggle') {
                  return (
                    <div
                      key={`inline-filter-${index}`}
                      className={clsx('inline-filter-toggle', filter.className)}
                    >
                      {filter.options.map((option) => (
                        <CWButton
                          key={option.value}
                          label={option.label}
                          buttonType={
                            filter.value === option.value
                              ? 'primary'
                              : 'secondary'
                          }
                          onClick={() => filter.onChange(option.value)}
                        />
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}

          <div className="actions">
            {onFilterClick && inlineFilters.length === 0 && (
              <CWButton
                label="Filters"
                iconRight="funnelSimple"
                buttonType="secondary"
                onClick={onFilterClick}
              />
            )}
          </div>
        </div>
      </div>

      {filterTags.length > 0 && (
        <div className="applied-filters-row">
          <div className="applied-filters">
            {filterTags.map((tag, index) => (
              <CWTag
                key={`${tag.label}-${index}`}
                label={tag.label}
                type="filter"
                onCloseClick={tag.onRemove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterRow;
