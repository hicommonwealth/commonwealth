export type GroupCategory = 'All groups' | 'In group' | 'Not in group';

export type SearchFilters = {
  searchText?: string;
  category?: GroupCategory;
};

export type MembershipFilter = 'in-group' | 'not-in-group';
