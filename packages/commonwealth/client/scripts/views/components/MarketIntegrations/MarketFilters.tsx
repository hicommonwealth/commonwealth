import React from 'react';
import { MarketFilters as IMarketFilters, MARKET_PROVIDERS } from './types';

interface MarketFiltersProps {
  filters: IMarketFilters;
  onFiltersChange: (filters: IMarketFilters) => void;
}

export function MarketFilters({
  filters,
  onFiltersChange,
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
    </div>
  );
}
