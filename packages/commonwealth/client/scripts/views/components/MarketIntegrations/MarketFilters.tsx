import React from 'react';
import type { SingleValue } from 'react-select';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './MarketFilters.scss';
import { MarketFilters as IMarketFilters, MARKET_PROVIDERS } from './types';

interface MarketFiltersProps {
  filters: IMarketFilters;
  onFiltersChange: (filters: IMarketFilters) => void;
  categories: (string | 'all')[];
}

type OptionType = {
  value: string;
  label: string;
};

export function MarketFilters({
  filters,
  onFiltersChange,
  categories,
}: MarketFiltersProps) {
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
      </div>
    </div>
  );
}
