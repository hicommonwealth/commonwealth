import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';
import React from 'react';
import { useFetchTagsQuery } from 'state/api/tags';
import CWAccordion from 'views/components/CWAccordion';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import './FiltersDrawer.scss';
import { FiltersDrawerProps } from './types';

const communityBases = Object.keys(ChainBase) as ChainBase[];

const communityNetworks: string[] = Object.keys(ChainNetwork).filter(
  (val) => val === 'ERC20', // only allowing ERC20 for now
);

export const FiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) => {
  const { data: tags } = useFetchTagsQuery();

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

  const onChainBaseOptionChange = (base: ChainBase) => {
    onFiltersChange({
      ...filters,
      withChainBase: filters.withChainBase === base ? undefined : base,
    });
  };

  const onChainNetworkFilterChange = (network: ChainNetwork) => {
    onFiltersChange({
      ...filters,
      withNetwork: filters.withNetwork === network ? undefined : network,
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

            <CWAccordion
              header="Community Tags"
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
              header="Community Chain"
              content={
                <div className="options-list">
                  {communityBases.map((base) => (
                    <button
                      className="chainbase-filter-btn"
                      key={base}
                      onClick={() => onChainBaseOptionChange(base)}
                    >
                      <CWText
                        fontWeight={
                          filters.withChainBase === base ? 'black' : 'regular'
                        }
                      >
                        {base}
                      </CWText>
                    </button>
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
