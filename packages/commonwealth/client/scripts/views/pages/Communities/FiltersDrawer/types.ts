import { ChainBase, ChainNetwork, CommunityType } from '@hicommonwealth/shared';

export type CommunityFilters = {
  withNetwork?: ChainNetwork;
  withCommunityEcosystem?: ChainBase;
  withEcosystemChainId?: string | number;
  withStakeEnabled?: boolean;
  withTagsIds?: number[];
  withCommunityType?: CommunityType;
  withCommunitySortBy?: string;
  withCommunitySortOrder?: string;
};

export type FiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: CommunityFilters;
  onFiltersChange: (newFilters: CommunityFilters) => void;
};
