export enum TokenSortOptions {
  MostRecent = 'Most Recent',
  MarketCap = 'Market Cap',
  Price = 'Price',
}

export enum TokenSortDirections {
  Ascending = 'Ascending',
  Descending = 'Descending',
}

export type TokenFilters = {
  withTokenSortBy?: TokenSortOptions;
  withTokenSortOrder?: TokenSortDirections;
};

export type FiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: TokenFilters;
  onFiltersChange: (newFilters: TokenFilters) => void;
};
