import { ChainBase, ChainNetwork, CommunityType } from '@hicommonwealth/shared';

export enum CommunitySortOptions {
  MostRecent = 'Most Recent',
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
  withLaunchpadToken?: boolean;
  withPinnedToken?: boolean;
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
