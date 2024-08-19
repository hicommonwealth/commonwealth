import { BaseGroupFilter } from '../../../../Members/index.types';

export type AllowListProps = {
  allowedAddresses: string[];
  setAllowedAddresses: (
    value: ((prevState: string[]) => string[]) | string[],
  ) => void;
};

export type AllowListGroupFilters =
  | BaseGroupFilter
  | 'allow-specified-addresses'
  | 'not-allow-specified-addresses';

export type AllowListSearchFilters = {
  searchText?: string;
  groupFilter?: AllowListGroupFilters;
};
