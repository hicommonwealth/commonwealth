import React from 'react';
import { Market } from './types';

interface MarketListItemProps {
  market: Market;
  isSelected: boolean;
  onSelectionChange: (marketId: string, isSelected: boolean) => void;
  isSaved?: boolean; // To indicate if the market is already saved to the community
}

export function MarketListItem({
  market,
  isSelected,
  onSelectionChange,
  isSaved,
}: MarketListItemProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange(market.id, e.target.checked);
  };

  const providerName =
    market.provider.charAt(0).toUpperCase() + market.provider.slice(1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
        opacity: isSaved ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={isSelected || isSaved}
        onChange={handleCheckboxChange}
        disabled={isSaved}
        style={{ transform: 'scale(1.2)' }}
      />
      <div style={{ flexGrow: 1 }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{market.question}</p>
        <p style={{ margin: '0.25rem 0 0', color: '#555', fontSize: '0.9em' }}>
          Provider: {providerName} | Category: {market.category}
        </p>
      </div>
    </div>
  );
}
