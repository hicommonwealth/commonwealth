export type GroupCategory = 'All' | 'In group' | 'Not in group';

export type SearchFilters = {
  searchText?: string;
  category?: GroupCategory;
};
