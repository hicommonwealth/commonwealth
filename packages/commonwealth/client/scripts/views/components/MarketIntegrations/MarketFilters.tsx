import React from 'react';
import type { SingleValue } from 'react-select';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './MarketFilters.scss';
import {
  MarketFilters as IMarketFilters,
  MARKET_PROVIDERS,
  MarketSortOrder,
  MarketStatus,
} from './types';

interface MarketFiltersProps {
  filters: IMarketFilters;
  onFiltersChange: (filters: IMarketFilters) => void;
  categories: (string | 'all')[];
}

type OptionType = {
  value: string;
  label: string;
};

export const MarketFilters = ({
  filters,
  onFiltersChange,
  categories,
}: MarketFiltersProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleProviderChange = (newValue: SingleValue<OptionType>) => {
    onFiltersChange({
      ...filters,
      provider: (newValue?.value || 'all') as IMarketFilters['provider'],
    });
  };

  const handleCategoryChange = (newValue: SingleValue<OptionType>) => {
    onFiltersChange({
      ...filters,
      category: newValue?.value || 'all',
    });
  };

  const handleStatusChange = (newValue: SingleValue<OptionType>) => {
    onFiltersChange({
      ...filters,
      status: (newValue?.value || 'all') as MarketStatus,
    });
  };

  const handleSortOrderChange = (newValue: SingleValue<OptionType>) => {
    onFiltersChange({
      ...filters,
      sortOrder: (newValue?.value || 'newest') as MarketSortOrder,
    });
  };

  const providerOptions: OptionType[] = [
    { value: 'all', label: 'All Providers' },
    ...MARKET_PROVIDERS.map((provider) => ({
      value: provider,
      label: provider.charAt(0).toUpperCase() + provider.slice(1),
    })),
  ];

  const categoryOptions: OptionType[] = categories.map((category) => ({
    value: category,
    label:
      category === 'all'
        ? 'All Categories'
        : category.charAt(0).toUpperCase() + category.slice(1),
  }));

  const statusOptions: OptionType[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'settled', label: 'Settled' },
  ];

  const sortOrderOptions: OptionType[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'ending-soon', label: 'Ending Soon' },
    { value: 'starting-soon', label: 'Starting Soon' },
  ];

  return (
    <div className="MarketFilters">
      <div className="filter-search">
        <CWTextInput
          placeholder="Search markets..."
          value={filters.search}
          onInput={handleSearchChange}
          fullWidth
        />
      </div>
      <div className="filter-selects">
        <CWSelectList
          options={providerOptions}
          value={providerOptions.find((opt) => opt.value === filters.provider)}
          onChange={handleProviderChange}
          label="Provider"
        />
        <CWSelectList
          options={categoryOptions}
          value={categoryOptions.find((opt) => opt.value === filters.category)}
          onChange={handleCategoryChange}
          label="Category"
        />
        <CWSelectList
          options={statusOptions}
          value={statusOptions.find((opt) => opt.value === filters.status)}
          onChange={handleStatusChange}
          label="Status"
        />
        <CWSelectList
          options={sortOrderOptions}
          value={sortOrderOptions.find(
            (opt) => opt.value === filters.sortOrder,
          )}
          onChange={handleSortOrderChange}
          label="Sort By"
        />
      </div>
    </div>
  );
};
