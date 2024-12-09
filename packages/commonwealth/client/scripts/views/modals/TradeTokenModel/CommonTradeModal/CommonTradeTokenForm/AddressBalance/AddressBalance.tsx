import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { TradingMode } from '../../../types';
import TokenIcon from '../../TokenIcon';
import { AddressBalanceProps } from '../types';
import './AddressBalance.scss';

const AddressBalance = ({ trading, addresses }: AddressBalanceProps) => {
  const isBuyMode = trading.mode.value === TradingMode.Buy;
  const isETH = isBuyMode;
  const isLoading =
    addresses.selected.balances[isBuyMode ? 'eth' : 'selectedToken'].isLoading;
  const balanceValue =
    addresses.selected.balances[isBuyMode ? 'eth' : 'selectedToken'].value;
  const tokenSymbol = isETH ? 'ETH' : trading.token.symbol;

  return (
    <CWText type="caption" className="AddressBalance">
      {isETH ? (
        <CWIcon iconName="ethereum" iconSize="small" />
      ) : (
        trading.token.icon_url && <TokenIcon url={trading.token.icon_url} />
      )}
      {isLoading ? <Skeleton width={80} /> : balanceValue}
      &nbsp;{tokenSymbol}
    </CWText>
  );
};

export default AddressBalance;
