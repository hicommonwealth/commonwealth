import React from 'react';
import { MarketFilters as IMarketFilters, MARKET_PROVIDERS } from './types';

interface MarketFiltersProps {
  filters: IMarketFilters;
  onFiltersChange: (filters: IMarketFilters) => void;
  categories: (string | 'all')[];
}

export function MarketFilters({
  filters,
  onFiltersChange,
  categories,
}: MarketFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      provider: e.target.value as IMarketFilters['provider'],
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      category: e.target.value,
    });
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder="Search markets..."
        value={filters.search}
        onChange={handleSearchChange}
        style={{ flexGrow: 1 }}
      />
      <select value={filters.provider} onChange={handleProviderChange}>
        <option value="all">All Providers</option>
        {MARKET_PROVIDERS.map((provider) => (
          <option key={provider} value={provider}>
            {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </option>
        ))}
      </select>
      <select value={filters.category} onChange={handleCategoryChange}>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category === 'all'
              ? 'All Categories'
              : category.charAt(0).toUpperCase() + category.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
