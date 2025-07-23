import { ChainBase, ChainNetwork, CommunityType } from '@hicommonwealth/shared';
import { SortByFilter } from 'client/scripts/views/components/CommonFiltersDrawer/SortByFilter';
import { SortOrderFilter } from 'client/scripts/views/components/CommonFiltersDrawer/SortOrderFilter';
import { useFlag } from 'hooks/useFlag';
import React from 'react';
import { useFetchTagsQuery } from 'state/api/tags';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';

import CWAccordion from 'client/scripts/views/components/CWAccordion';
import { CommonFiltersDrawer } from 'client/scripts/views/components/CommonFiltersDrawer/CommonFiltersDrawer';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import './FiltersDrawer.scss';
import {
  communityBases,
  communityChains,
  communityNetworks,
  communitySortOptionsLabelToKeysMap,
  communityTypes,
  sortOrderLabelsToDirectionsMap,
} from './constants';
import {
  CommunitySortDirections,
  CommunitySortOptions,
  FiltersDrawerProps,
} from './types';

const sortByOptions = Object.entries(communitySortOptionsLabelToKeysMap).map(
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
  const { data: tags } = useFetchTagsQuery({ enabled: true });
  const launchpadEnabled = useFlag('launchpad');

  const onStakeFilterChange = () => {
    onFiltersChange({
      ...filters,
      withStakeEnabled: !filters.withStakeEnabled,
    });
  };

  const onLaunchpadTokenFilterChange = () => {
    onFiltersChange({
      ...filters,
      withLaunchpadToken: !filters.withLaunchpadToken,
    });
  };

  const onPinnedTokenFilterChange = () => {
    onFiltersChange({
      ...filters,
      withPinnedToken: !filters.withPinnedToken,
    });
  };

  const onTagOptionChange = (tagId: number) => {
    onFiltersChange({
      ...filters,
      withTagsIds: (filters.withTagsIds || []).includes(tagId)
        ? [...(filters.withTagsIds || [])].filter((id) => id !== tagId)
        : [...(filters.withTagsIds || []), tagId],
    });
  };

  const onCommunityEcosystemOptionChange = (base: ChainBase) => {
    onFiltersChange({
      ...filters,
      withCommunityEcosystem:
        filters.withCommunityEcosystem === base ? undefined : base,
      withEcosystemChainId: base ? undefined : filters.withEcosystemChainId,
    });
  };

  const onCommunityEcosystemChainIdChange = (chainId: number | string) => {
    onFiltersChange({
      ...filters,
      withCommunityEcosystem: chainId
        ? undefined
        : filters.withCommunityEcosystem,
      withEcosystemChainId:
        filters.withEcosystemChainId === chainId ? undefined : chainId,
    });
  };

  const onChainNetworkFilterChange = (network: ChainNetwork) => {
    onFiltersChange({
      ...filters,
      withNetwork: filters.withNetwork === network ? undefined : network,
    });
  };

  const onCommunityTypeChange = (type: CommunityType) => {
    onFiltersChange({
      ...filters,
      withCommunityType: filters.withCommunityType === type ? undefined : type,
    });
  };

  const onCommunitySortOptionChange = (sortOption: CommunitySortOptions) => {
    onFiltersChange({
      ...filters,
      withCommunitySortOrder: (sortOption === CommunitySortOptions.MostRecent
        ? Object.entries(sortOrderLabelsToDirectionsMap).find(
          ([_, v]) => v === sortOrderLabelsToDirectionsMap.Descending,
        )?.[0]
        : filters.withCommunitySortOrder ||
        Object.entries(sortOrderLabelsToDirectionsMap).find(
          ([_, v]) => v === sortOrderLabelsToDirectionsMap.Descending,
        )?.[0]) as CommunitySortDirections,
      withCommunitySortBy:
        filters.withCommunitySortBy === sortOption ? undefined : sortOption,
    });
  };

  const onCommunityOrderChange = (sortOrder: CommunitySortDirections) => {
    onFiltersChange({
      ...filters,
      withCommunitySortOrder:
        filters.withCommunitySortOrder === sortOrder ? undefined : sortOrder,
    });
  };

  const hasAppliedFilters =
    Object.values(filters).filter(Boolean).length === 1
      ? !filters.withCommunitySortOrder
      : Object.values(filters).filter(Boolean).length > 0;

  return (
    <CommonFiltersDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Community Filters"
    >
      <div className="stake-filter">
        <CWText type="h5" fontWeight="semiBold">
          Has Member Stake
        </CWText>
        <CWToggle
          size="small"
          checked={filters.withStakeEnabled}
          onChange={onStakeFilterChange}
        />
      </div>
      <div className="stake-filter">
        <CWText type="h5" fontWeight="semiBold">
          Has Launchpad Token
        </CWText>
        <CWToggle
          size="small"
          checked={filters.withLaunchpadToken}
          onChange={onLaunchpadTokenFilterChange}
        />
      </div>
      <div className="stake-filter">
        <CWText type="h5" fontWeight="semiBold">
          Has External Token
        </CWText>
        <CWToggle
          size="small"
          checked={filters.withPinnedToken}
          onChange={onPinnedTokenFilterChange}
        />
      </div>
      {launchpadEnabled && (
        <>
          <SortByFilter
            options={sortByOptions}
            selected={filters.withCommunitySortBy}
            onChange={onCommunitySortOptionChange}
            groupName="community-sort-option"
          />
          <SortOrderFilter
            options={sortOrderOptions}
            selected={filters.withCommunitySortOrder}
            onChange={onCommunityOrderChange}
            groupName="community-sort-direction"
            disabled={
              filters.withCommunitySortBy === CommunitySortOptions.MostRecent ||
              !hasAppliedFilters
            }
          />
          <CWAccordion
            header="Community Type"
            content={
              <div className="options-list">
                {communityTypes.map((type) => (
                  <CWRadioButton
                    key={type}
                    groupName="community-type"
                    value={type}
                    label={type}
                    checked={filters.withCommunityType === type}
                    onChange={() => onCommunityTypeChange(type)}
                  />
                ))}
              </div>
            }
          />
        </>
      )}
      <CWAccordion
        header="Community Preferences"
        content={
          <div className="options-list">
            {(tags || []).map((t) => (
              <CWCheckbox
                key={t.id}
                label={t.name}
                checked={(filters.withTagsIds || []).includes(t.id!)}
                onChange={() => onTagOptionChange(t.id!)}
              />
            ))}
          </div>
        }
      />

      <CWAccordion
        header="Community Ecosystem"
        content={
          <div className="options-list">
            {Object.keys(communityBases).map((base) => (
              <CWRadioButton
                key={base}
                groupName="community-ecosystem"
                value={base}
                label={base}
                checked={
                  filters.withCommunityEcosystem === communityBases[base]
                }
                onChange={(e) =>
                  e.target.checked &&
                  onCommunityEcosystemOptionChange(communityBases[base])
                }
              />
            ))}
            {launchpadEnabled &&
              Object.keys(communityChains).map((chain) => (
                <CWRadioButton
                  key={chain}
                  groupName="community-ecosystem"
                  value={chain}
                  label={chain}
                  checked={
                    filters.withEcosystemChainId === communityChains[chain]
                  }
                  onChange={(e) =>
                    e.target.checked &&
                    onCommunityEcosystemChainIdChange(communityChains[chain])
                  }
                />
              ))}
          </div>
        }
      />

      <CWAccordion
        header="Community Network"
        content={
          <div className="options-list">
            {communityNetworks.map((network: ChainNetwork) => (
              <CWCheckbox
                key={network}
                label={network}
                checked={filters.withNetwork === network}
                onChange={() => onChainNetworkFilterChange(network)}
              />
            ))}
          </div>
        }
      />
    </CommonFiltersDrawer>
  );
};
