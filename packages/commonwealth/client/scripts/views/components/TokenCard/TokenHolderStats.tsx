import {
  currencyNameToSymbolMap,
  SupportedFiatCurrencies,
} from 'helpers/currency';
import React from 'react';
import { useGetTokenStatsQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import FormattedDisplayNumber from '../FormattedDisplayNumber/FormattedDisplayNumber';
import './TokenHolderStats.scss';

interface TokenStats {
  holder_count: number;
  volume_24h: number;
}

export interface TokenHolderStatsProps {
  tokenAddress: string;
  currency?: SupportedFiatCurrencies;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const TokenHolderStats = ({
  tokenAddress,
  currency = SupportedFiatCurrencies.USD,
  className,
  onClick,
}: TokenHolderStatsProps) => {
  const { data: stats } = useGetTokenStatsQuery({
    token_address: tokenAddress,
  }) as { data: TokenStats | undefined };

  const currencySymbol = currencyNameToSymbolMap[currency];

  if (!stats) {
    return null;
  }

  return (
    <div className={className} onClick={onClick}>
      <CWText type="caption" className="text-light">
        Holders {stats.holder_count}
      </CWText>
      <CWText type="caption" className="ml-auto text-light">
        Vol 24h {currencySymbol}
        <FormattedDisplayNumber
          value={stats.volume_24h}
          options={{ decimals: 1, useShortSuffixes: true }}
        />
      </CWText>
    </div>
  );
};

export default TokenHolderStats;
