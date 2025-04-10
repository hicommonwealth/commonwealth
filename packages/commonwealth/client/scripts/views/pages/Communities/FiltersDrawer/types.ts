import { ChainBase, ChainNetwork, CommunityType } from '@hicommonwealth/shared';

export enum CommunitySortOptions {
  MostRecent = 'Newest',
  MarketCap = 'Market Cap',
  Price = 'Price',
  MemberCount = '# of 👥',
  ThreadCount = '# of ✏️',
}

export enum CommunitySortDirections {
  Ascending = 'High',
  Descending = 'Low',
}

export type CommunityFilters = {
  withNetwork?: ChainNetwork;
  withCommunityEcosystem?: ChainBase;
  withEcosystemChainId?: string | number;
  withStakeEnabled?: boolean;
  withTagsIds?: number[];
  withCommunityType?: CommunityType;
  withCommunitySortBy?: CommunitySortOptions;
  withCommunitySortOrder?: CommunitySortDirections;
};

export type FiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: CommunityFilters;
  onFiltersChange: (newFilters: CommunityFilters) => void;
};
