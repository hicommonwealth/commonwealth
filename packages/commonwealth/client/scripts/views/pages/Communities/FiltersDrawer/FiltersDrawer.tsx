import { ChainBase, ChainNetwork, CommunityType } from '@hicommonwealth/shared';
import { useFlag } from 'hooks/useFlag';
import React from 'react';
import { useFetchTagsQuery } from 'state/api/tags';
import CWAccordion from 'views/components/CWAccordion';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import './FiltersDrawer.scss';
import {
  communityBases,
  communityChains,
  communityNetworks,
  communitySortOptionsLabelToKeysMap,
  communityTypes,
  sortOrderLabelsToDirectionsMap,
} from './constants';
import { FiltersDrawerProps } from './types';

export const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  const { data: tags } = useFetchTagsQuery();
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const onStakeFilterChange = () => {
    onFiltersChange({
      ...filters,
      withStakeEnabled: !filters.withStakeEnabled,
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

  const onCommunitySortOptionChange = (sortOption: string) => {
    onFiltersChange({
      ...filters,
      withCommunitySortOrder:
        sortOption === 'Most Recent'
          ? Object.entries(sortOrderLabelsToDirectionsMap).find(
              ([_, v]) => v === 'DESC',
            )?.[0]
          : filters.withCommunitySortOrder ||
            Object.entries(sortOrderLabelsToDirectionsMap).find(
              ([_, v]) => v === 'DESC',
            )?.[0],
      withCommunitySortBy:
        filters.withCommunitySortBy === sortOption ? undefined : sortOption,
    });
  };

  const onCommunityOrderChange = (sortOrder: string) => {
    onFiltersChange({
      ...filters,
      withCommunitySortOrder:
        filters.withCommunitySortOrder === sortOrder ? undefined : sortOrder,
    });
  };

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
          <CWText type="h3">Community Filters</CWText>
          <div className="filter-content">
            <div className="stake-filter">
              <CWText type="h5" fontWeight="semiBold">
                Stake
              </CWText>
              <CWToggle
                size="small"
                checked={filters.withStakeEnabled}
                onChange={() => onStakeFilterChange()}
              />
            </div>

            {tokenizedCommunityEnabled && (
              <>
                <CWAccordion
                  header="Sort By"
                  content={
                    <div className="options-list">
                      {Object.entries(communitySortOptionsLabelToKeysMap).map(
                        ([sortOption]) => (
                          <CWRadioButton
                            key={sortOption}
                            groupName="community-sort-option"
                            value={sortOption}
                            label={sortOption}
                            checked={filters.withCommunitySortBy === sortOption}
                            onChange={() =>
                              onCommunitySortOptionChange(sortOption)
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
                            groupName="community-sort-direction"
                            value={order}
                            label={order}
                            checked={filters.withCommunitySortOrder === order}
                            onChange={() => onCommunityOrderChange(order)}
                            disabled={
                              filters.withCommunitySortBy === 'Most Recent'
                            }
                          />
                        ),
                      )}
                    </div>
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
                  {(tags || [])?.map((t) => (
                    <CWCheckbox
                      key={t.id}
                      label={t.name}
                      checked={(filters.withTagsIds || []).includes(t.id)}
                      onChange={() => onTagOptionChange(t.id)}
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
                  {tokenizedCommunityEnabled &&
                    Object.keys(communityChains).map((chain) => (
                      <CWRadioButton
                        key={chain}
                        groupName="community-ecosystem"
                        value={chain}
                        label={chain}
                        checked={
                          filters.withEcosystemChainId ===
                          communityChains[chain]
                        }
                        onChange={(e) =>
                          e.target.checked &&
                          onCommunityEcosystemChainIdChange(
                            communityChains[chain],
                          )
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
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};
