import { Dispatch, SetStateAction } from 'react';
import { FilterTag, InlineFilter } from './SearchFilterRow';

/**
 * Common interface for filter options
 */
export interface FilterOption {
  value: string;
  label: string;
  fullLabel?: string;
}

/**
 * Interface for filter state
 */
export interface FilterState<T> {
  selectedValue: T;
  setSelectedValue: Dispatch<SetStateAction<T>>;
  filterTags: FilterTag[];
  setFilterTags: Dispatch<SetStateAction<FilterTag[]>>;
  forceRefreshKey?: number;
  setForceRefreshKey?: Dispatch<SetStateAction<number>>;
}

/**
 * Create a toggle filter (like active/past/all) with proper filter tag management
 */
export function createToggleFilter<T extends string>({
  label,
  placeholder,
  options,
  state: {
    selectedValue,
    setSelectedValue,
    filterTags,
    setFilterTags,
    forceRefreshKey,
    setForceRefreshKey,
  },
  getLabel,
  getRemoveTagsFilter,
  defaultValue,
  tagPrefix,
}: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  state: FilterState<T>;
  getLabel: (value: T) => string;
  getRemoveTagsFilter: (tags: FilterTag[]) => FilterTag[];
  defaultValue: T;
  tagPrefix: string;
}): InlineFilter {
  return {
    type: 'select',
    label,
    placeholder,
    value: {
      value: selectedValue,
      label: getLabel(selectedValue),
    },
    onChange: (option) => {
      if (!option) return;

      // Update selected value
      const newValue = option.value as T;
      setSelectedValue(newValue);

      // Force refresh if needed
      if (setForceRefreshKey) {
        setForceRefreshKey((prevKey) => prevKey + 1);
      }

      // Update filter tags
      const newTags = getRemoveTagsFilter(filterTags);

      if (newValue !== defaultValue) {
        newTags.push({
          label: `${tagPrefix}: ${getLabel(newValue)}`,
          onRemove: () => {
            setSelectedValue(defaultValue);
            if (setForceRefreshKey) {
              setForceRefreshKey((prevKey) => prevKey + 1);
            }
            setFilterTags((prevTags) => getRemoveTagsFilter(prevTags));
          },
        });
      }

      setFilterTags(newTags);
    },
    options,
    isClearable: false,
    isSearchable: false,
  };
}

/**
 * Create a select filter (like community selection) with proper filter tag management
 */
export function createSelectFilter<T extends string>({
  label,
  placeholder,
  className,
  options,
  state: {
    selectedValue,
    setSelectedValue,
    filterTags,
    setFilterTags,
    forceRefreshKey,
    setForceRefreshKey,
  },
  getTagLabel,
  tagPrefix,
}: {
  label: string;
  placeholder: string;
  className?: string;
  options: FilterOption[];
  state: FilterState<T>;
  getTagLabel?: (option: FilterOption) => string;
  tagPrefix: string;
}): InlineFilter {
  return {
    type: 'select',
    label,
    placeholder,
    className,
    value: options.find((opt) => opt.value === selectedValue),
    onChange: (option) => {
      if (!option) {
        // Handle clearing the selection
        setSelectedValue('' as T);
        if (setForceRefreshKey) {
          setForceRefreshKey((prevKey) => prevKey + 1);
        }
        setFilterTags((prevTags) =>
          prevTags.filter((tag) => !tag.label.startsWith(`${tagPrefix}:`)),
        );
        return;
      }

      setSelectedValue(option.value as T);
      if (setForceRefreshKey) {
        setForceRefreshKey((prevKey) => prevKey + 1);
      }

      // Update filter tags
      const newTags = filterTags.filter(
        (tag) => !tag.label.startsWith(`${tagPrefix}:`),
      );

      if (option.value) {
        const displayName = getTagLabel
          ? getTagLabel(option)
          : option.fullLabel || option.label;
        newTags.push({
          label: `${tagPrefix}: ${displayName}`,
          onRemove: () => {
            setSelectedValue('' as T);
            if (setForceRefreshKey) {
              setForceRefreshKey((prevKey) => prevKey + 1);
            }
            setFilterTags((prevTags) =>
              prevTags.filter((tag) => !tag.label.startsWith(`${tagPrefix}:`)),
            );
          },
        });
      }

      setFilterTags(newTags);
    },
    options,
    isClearable: true,
    isSearchable: true,
  };
}

/**
 * Create a search filter tag
 */
export function createSearchFilterTag(
  searchValue: string,
  setSearchValue: (value: string) => void,
): FilterTag {
  if (!searchValue) {
    // Return a dummy tag that won't be used
    return {
      label: '',
      onRemove: () => {},
    };
  }

  return {
    label: `Search: ${searchValue}`,
    onRemove: () => setSearchValue(''),
  };
}
