import { useFlag } from 'hooks/useFlag';
import React from 'react';
import CWAccordion from 'views/components/CWAccordion';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import './FiltersDrawer.scss';
import {
  sortOrderLabelsToDirectionsMap,
  tokenSortOptionsLabelToKeysMap,
} from './constants';
import {
  FiltersDrawerProps,
  TokenSortDirections,
  TokenSortOptions,
} from './types';

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
    <div className="FiltersDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="filter-drawer"
        open={isOpen}
        onClose={() => onClose()}
      >
        <CWDrawerTopBar onClose={() => onClose()} />

        <div className="content-container">
          <CWText type="h3">Token Filters</CWText>
          <div className="filter-content">
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
                <CWAccordion
                  header="Sort By"
                  content={
                    <div className="options-list">
                      {Object.entries(tokenSortOptionsLabelToKeysMap).map(
                        ([sortOption]) => (
                          <CWRadioButton
                            key={sortOption}
                            groupName="token-sort-option"
                            value={sortOption}
                            label={sortOption}
                            checked={filters.withTokenSortBy === sortOption}
                            onChange={() =>
                              onTokenSortOptionChange(
                                sortOption as TokenSortOptions,
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  }
                />

                <CWAccordion
                  header="Sort Order"
                  content={
                    <div className="options-list">
                      {Object.entries(sortOrderLabelsToDirectionsMap).map(
                        ([order]) => (
                          <CWRadioButton
                            key={order}
                            groupName="token-sort-direction"
                            value={order}
                            label={order}
                            checked={filters.withTokenSortOrder === order}
                            onChange={() =>
                              onCommunityOrderChange(
                                order as TokenSortDirections,
                              )
                            }
                            disabled={
                              filters.withTokenSortBy ===
                                TokenSortOptions.MostRecent ||
                              !hasAppliedFilters
                            }
                          />
                        ),
                      )}
                    </div>
                  }
                />
              </>
            )}
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};
