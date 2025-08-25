import { APIOrderDirection } from 'helpers/constants';
import { getRelativeTimestamp } from 'helpers/dates';
import React from 'react';
import { CWIcon } from '../../../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../../../component_kit/cw_text';
import { CWTable } from '../../../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../../../component_kit/new_designs/CWTable/useCWTableState';
import { CWTooltip } from '../../../../component_kit/new_designs/CWTooltip';
import { formatValue } from './helpers';
import './TradeActivityTable.scss';

interface TradeActivityTableProps {
  trades: any[];
}

const TradeActivityTable = ({ trades }: TradeActivityTableProps) => {
  const columns: CWTableColumnInfo[] = [
    {
      key: 'transactionType',
      header: 'Transaction Type',
      numeric: false,
      sortable: true,
    },
    {
      key: 'assets',
      header: 'Assets',
      numeric: false,
      sortable: true,
      hasCustomSortValue: true,
    },
    {
      key: 'time',
      header: 'Time',
      numeric: false,
      sortable: true,
      hasCustomSortValue: true,
    },
    {
      key: 'transaction',
      header: () => <CWIcon iconName="etherscan" iconSize="regular" />,
      numeric: false,
      sortable: false,
    },
  ];

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'time',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const rowData = trades.map((trade) => ({
    transactionType: {
      customElement: (
        <CWText type="b1" className="capitalize">
          {trade.is_buy ? 'Buy' : 'Sell'}
        </CWText>
      ),
    },
    assets: {
      sortValue: parseFloat(trade.community_token_amount),
      customElement: (
        <div className="asset-value">
          <CWText type="b1" fontWeight="semiBold">
            {trade.is_buy ? 'Buy' : 'Sell'} /{' '}
            {formatValue(parseFloat(trade.community_token_amount) / 1e18)}{' '}
            tokens
          </CWText>
          <CWText type="caption">
            {formatValue(parseFloat(trade.price))} ETH
          </CWText>
        </div>
      ),
    },
    time: {
      sortValue: trade.timestamp,
      customElement: (
        <CWTooltip
          content={new Date(trade.timestamp * 1000).toLocaleString()}
          renderTrigger={(handleInteraction) => (
            <span
              className="timestamp"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              {getRelativeTimestamp(trade.timestamp * 1000)}
            </span>
          )}
        />
      ),
    },
    transaction: {
      customElement: (
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://sepolia.basescan.org/tx/${trade.transaction_hash}`}
          onClick={(e) => e.stopPropagation()}
        >
          <CWIcon iconName="externalLink" className="etherscanLink" />
        </a>
      ),
    },
  }));

  return (
    <div className="trade-activity-tab">
      <CWTable
        columnInfo={tableState.columns}
        rowData={rowData}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
      />
    </div>
  );
};

export default TradeActivityTable;
