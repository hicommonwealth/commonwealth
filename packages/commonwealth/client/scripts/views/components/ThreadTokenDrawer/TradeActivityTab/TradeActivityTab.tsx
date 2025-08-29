import React from 'react';
import { APIOrderDirection } from '../../../../helpers/constants';
import { CWText } from '../../component_kit/cw_text';
import { CWTable } from '../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../component_kit/new_designs/CWTable/useCWTableState';

type TradeActivity = {
  id: string;
  type: 'buy' | 'sell';
  amount: string;
  price: number;
  timestamp: number;
  address: string;
};

const tradeActivityColumns: CWTableColumnInfo[] = [
  {
    key: 'user',
    header: 'User',
    numeric: false,
    sortable: true,
  },
  {
    key: 'type',
    header: 'Type',
    numeric: false,
    sortable: true,
  },
  {
    key: 'amount',
    header: 'Amount',
    numeric: true,
    sortable: true,
  },
  {
    key: 'price',
    header: 'Price',
    numeric: true,
    sortable: true,
  },
  {
    key: 'timestamp',
    header: 'Time',
    numeric: true,
    sortable: true,
    chronological: true,
  },
];

interface TradeActivityTabProps {
  tradesData: any;
  isLoadingTrades: boolean;
}

export const TradeActivityTab = ({
  tradesData,
  isLoadingTrades,
}: TradeActivityTabProps) => {
  const tradeActivityTableState = useCWTableState({
    columns: tradeActivityColumns,
    initialSortColumn: 'timestamp',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const getTradeActivityRowData = (activities: any[]) => {
    return activities.map((activity) => ({
      user: {
        sortValue: activity.address,
        customElement: (
          <div className="user-info">
            <CWText type="b2" className="address">
              {activity.address}
            </CWText>
          </div>
        ),
      },
      type: {
        sortValue: activity.type,
        customElement: (
          <div className={`trade-type ${activity.type}`}>
            <CWText type="b2" className={activity.type}>
              {activity.type.toUpperCase()}
            </CWText>
          </div>
        ),
      },
      amount: parseFloat(activity.amount).toLocaleString(),
      price: `${activity.price} ETH`,
      timestamp: new Date(activity.timestamp * 1000).toISOString(),
    }));
  };

  return (
    <div className="tab-content">
      <CWText type="h4" className="tab-header">
        Recent Trade Activity
      </CWText>
      {isLoadingTrades ? (
        <div className="loading-state">
          <CWText type="b1" className="loading-text">
            Loading trade activity...
          </CWText>
        </div>
      ) : tradesData &&
        (tradesData as any).result &&
        (tradesData as any).result.length > 0 ? (
        <CWTable
          columnInfo={tradeActivityTableState.columns}
          sortingState={tradeActivityTableState.sorting}
          setSortingState={tradeActivityTableState.setSorting}
          rowData={getTradeActivityRowData((tradesData as any).result)}
        />
      ) : (
        <div className="empty-state">
          <CWText type="b1" className="empty-text">
            No trade activity yet.
          </CWText>
        </div>
      )}
    </div>
  );
};
