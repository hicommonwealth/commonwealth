import { ChainBase, ChainNetwork, CommunityType } from '@hicommonwealth/shared';

export enum CommunitySortOptions {
  MostRecent = 'Most Recent',
  MarketCap = 'Market Cap',
  Price = 'Price',
  MemberCount = 'Number of Members',
  ThreadCount = 'Number of Threads',
}

export enum CommunitySortDirections {
  Ascending = 'Ascending',
  Descending = 'Descending',
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
