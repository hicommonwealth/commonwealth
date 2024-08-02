export type BaseGroupFilter = 'All groups' | 'Ungrouped';

export type SearchFilters = {
  searchText?: string;
  groupFilter?: BaseGroupFilter | number; // or the group id represented by number
};

export type MemberReultsOrderBy = 'name' | 'last_active' | undefined;
