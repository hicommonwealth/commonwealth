import { useFlag } from 'hooks/useFlag';
import React from 'react';
import { CommonFiltersDrawer } from 'views/components/CommonFiltersDrawer';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { SortByFilter } from 'views/components/SortByFilter';
import { SortOrderFilter } from 'views/components/SortOrderFilter';
import {
  sortOrderLabelsToDirectionsMap,
  tokenSortOptionsLabelToKeysMap,
} from './constants';
import './FiltersDrawer.scss';
import {
  FiltersDrawerProps,
  TokenSortDirections,
  TokenSortOptions,
} from './types';

const sortByOptions = Object.entries(tokenSortOptionsLabelToKeysMap).map(
  ([label, value]) => ({ label, value }),
);
const sortOrderOptions = Object.entries(sortOrderLabelsToDirectionsMap).map(
  ([label, value]) => ({ label, value }),
);

export const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  const launchpadEnabled = useFlag('launchpad');

  const onTokenSortOptionChange = (sortOption: TokenSortOptions) => {
    onFiltersChange({
      ...filters,
      withTokenSortOrder: (sortOption === TokenSortOptions.MostRecent
        ? Object.entries(sortOrderLabelsToDirectionsMap).find(
            ([_, v]) => v === sortOrderLabelsToDirectionsMap.Descending,
          )?.[0]
        : filters.withTokenSortOrder ||
          Object.entries(sortOrderLabelsToDirectionsMap).find(
            ([_, v]) => v === sortOrderLabelsToDirectionsMap.Descending,
          )?.[0]) as TokenSortDirections,
      withTokenSortBy:
        filters.withTokenSortBy === sortOption ? undefined : sortOption,
    });
  };

  const onCommunityOrderChange = (sortOrder: TokenSortDirections) => {
    onFiltersChange({
      ...filters,
      withTokenSortOrder:
        filters.withTokenSortOrder === sortOrder ? undefined : sortOrder,
    });
  };

  const onIsGraduatedChange = (isGraduated: boolean) => {
    onFiltersChange({
      ...filters,
      isGraduated,
    });
  };

  const hasAppliedFilters =
    Object.values(filters).filter(Boolean).length === 1
      ? !filters.withTokenSortOrder
      : Object.values(filters).filter(Boolean).length > 0;

  return (
    <CommonFiltersDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Token Filters"
    >
      <div className="graduated-filter">
        <CWText type="h5" fontWeight="semiBold">
          Graduated
        </CWText>
        <CWToggle
          size="small"
          checked={filters.isGraduated}
          onChange={() => onIsGraduatedChange(!filters.isGraduated)}
        />
      </div>
      {launchpadEnabled && (
        <>
          <SortByFilter
            options={sortByOptions}
            selected={filters.withTokenSortBy}
            onChange={onTokenSortOptionChange}
            groupName="token-sort-option"
          />
          <SortOrderFilter
            options={sortOrderOptions}
            selected={filters.withTokenSortOrder}
            onChange={onCommunityOrderChange}
            groupName="token-sort-direction"
            disabled={
              filters.withTokenSortBy === TokenSortOptions.MostRecent ||
              !hasAppliedFilters
            }
          />
        </>
      )}
    </CommonFiltersDrawer>
  );
};
