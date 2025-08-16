export type BaseGroupFilter = 'all-community' | 'not-in-group' | number; // the number type is here for group id's

export type SearchFilters = {
  searchText?: string;
  groupFilter?: BaseGroupFilter;
};

export type MemberResultsOrderBy =
  | 'name'
  | 'last_active'
  | 'aura'
  | 'referrals'
  | 'earnings'
  | undefined;
