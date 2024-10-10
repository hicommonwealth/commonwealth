import { ChainBase, ChainNetwork } from '@hicommonwealth/shared';

export type CommunityFilters = {
  withNetwork?: ChainNetwork;
  withChainBase?: ChainBase;
  withStakeEnabled?: boolean;
  withTagsIds?: number[];
};

export type FiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: CommunityFilters;
  onFiltersChange: (newFilters: CommunityFilters) => void;
};
