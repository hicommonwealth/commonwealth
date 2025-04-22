import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import FormattedDisplayNumber from '../../../../../components/FormattedDisplayNumber/FormattedDisplayNumber';
import TokenIcon from '../../../TokenIcon';
import { TradingMode } from '../../../types';
import { AddressBalanceProps } from '../types';
import './AddressBalance.scss';

const AddressBalance = ({ trading, addresses }: AddressBalanceProps) => {
  console.log('[AddressBalance] Props:', { trading, addresses });

  const isBuyMode = trading.mode.value === TradingMode.Buy;
  const isETH = isBuyMode;

  const balanceKey = isBuyMode ? 'eth' : 'selectedToken';
  const balanceInfo = addresses.selected?.balances?.[balanceKey];

  console.log(`[AddressBalance] Using balanceKey: ${balanceKey}`);
  console.log(
    '[AddressBalance] Derived balanceInfo from addresses:',
    balanceInfo,
  );

  const tokenSymbol = isETH ? 'ETH' : trading.token?.symbol || '...'; // Add safe access for symbol

  const renderBalance = () => {
    const isLoading = balanceInfo?.isLoading;
    console.log('[AddressBalance] isLoading:', isLoading);

    // Show skeleton only if data structure exists and isLoading is true
    if (isLoading) {
      return <Skeleton width={80} />;
    }

    // Ensure balanceData and value exist before rendering FormattedDisplayNumber
    // If balanceData is undefined or isLoading is false, try to display value or N/A
    const valueToDisplay = balanceInfo?.value;
    console.log('[AddressBalance] valueToDisplay:', valueToDisplay);

    return (
      <>
        {isETH ? (
          <CWIcon iconName="ethereum" iconSize="small" />
        ) : (
          trading.token?.icon_url && (
            <TokenIcon url={trading.token.icon_url} size="small" />
          )
        )}
        {valueToDisplay !== undefined ? (
          <FormattedDisplayNumber
            className="AddressBalance ml-1 mr-1"
            type="caption"
            value={valueToDisplay}
            options={{ decimals: 4 }}
          />
        ) : (
          <CWText type="caption" className="AddressBalance na-value ml-1 mr-1">
            N/A
          </CWText>
        )}
        <CWText type="caption">{tokenSymbol}</CWText>
      </>
    );
  };

  return <div className="address-balance-container">{renderBalance()}</div>;
};

export default AddressBalance;
