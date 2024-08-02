export type BaseGroupFilter = 'all-community' | 'not-in-group' | number;

export type SearchFilters = {
  searchText?: string;
  groupFilter?: BaseGroupFilter; // or the group id represented by number
};

export type MemberResultsOrderBy = 'name' | 'last_active' | undefined;
