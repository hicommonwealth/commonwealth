import { MagnifyingGlass } from '@phosphor-icons/react';
import clsx from 'clsx';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
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
  type: 'select' | 'toggle';
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
  selectedViewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  onFilterClick?: () => void;
  filterTags?: FilterTag[];
  placeholder?: string;
  showViewToggle?: boolean;
  inlineFilters?: InlineFilter[];
}

const SearchFilterRow: React.FC<SearchFilterRowProps> = ({
  searchValue,
  onSearchChange,
  selectedViewType,
  onViewTypeChange,
  onFilterClick,
  filterTags = [],
  placeholder = 'Search',
  showViewToggle = true,
  inlineFilters = [],
}) => {
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
                if (filter.type === 'select') {
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

            {showViewToggle && (
              <div className="view-toggle">
                <div
                  className={clsx('icon-container', {
                    selected: selectedViewType === ViewType.List,
                  })}
                >
                  <CWIconButton
                    iconName="rows"
                    weight="light"
                    onClick={() => onViewTypeChange(ViewType.List)}
                  />
                </div>
                <div
                  className={clsx('icon-container', {
                    selected: selectedViewType === ViewType.Cards,
                  })}
                >
                  <CWIconButton
                    iconName="squaresFour"
                    weight="light"
                    onClick={() => onViewTypeChange(ViewType.Cards)}
                  />
                </div>
              </div>
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
