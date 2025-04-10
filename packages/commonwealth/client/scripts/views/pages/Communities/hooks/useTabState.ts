import { useState } from 'react';
import { FilterTag } from '../SearchFilterRow';
import { createSearchFilterTag } from '../filters';

// Define an interface for tab state configuration
export interface TabStateConfig<T = any> {
  initialState?: T;
  initialFilterTags?: FilterTag[];
  includeSearchInTags?: boolean;
}

// Create a generic hook for managing tab state
export function useTabState<T = string>(
  searchValue: string,
  setSearchValue: (value: string) => void,
  config: TabStateConfig<T> = {},
) {
  const {
    initialState,
    initialFilterTags = [],
    includeSearchInTags = true,
  } = config;

  const [selectedValue, setSelectedValue] = useState<T | undefined>(
    initialState,
  );
  const [filterTags, setFilterTags] = useState<FilterTag[]>(initialFilterTags);
  const [filterKey, setFilterKey] = useState(0);

  // Get the filter tags for this tab
  const getFilterTags = (): FilterTag[] => {
    const tags = [...filterTags];

    if (includeSearchInTags && searchValue) {
      const searchTag = createSearchFilterTag(searchValue, setSearchValue);
      if (searchTag) {
        tags.push(searchTag);
      }
    }

    return tags;
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedValue(initialState);
    setFilterTags([]);
    setFilterKey((prev) => prev + 1);
  };

  return {
    selectedValue,
    setSelectedValue,
    filterTags,
    setFilterTags,
    filterKey,
    setFilterKey,
    getFilterTags,
    resetFilters,
  };
}
