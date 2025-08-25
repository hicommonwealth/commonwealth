import { GetThreadTokenTradesOutput } from '@hicommonwealth/schemas';
import { APIOrderDirection } from 'client/scripts/helpers/constants';
import React from 'react';
import { CWTable } from '../../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../../component_kit/new_designs/CWTable/useCWTableState';

interface HoldersTabProps {
  data?: typeof GetThreadTokenTradesOutput;
  isLoading: boolean;
}

const calculateHoldings = (data: typeof GetThreadTokenTradesOutput) => {
  const userHoldings = {};
  for (const holder of data.result) {
    let sum = 0;
    for (const trade of holder.trades) {
      const direction = trade.isBuy ? 1 : -1;
      sum += trade.community_token_amount * direction;
    }
    userHoldings[holder.user_id] = sum;
  }
  return;
};

export const HoldersTab = ({ data, isLoading }: HoldersTabProps) => {
  const columns: CWTableColumnInfo[] = [
    {
      key: 'holder',
      header: 'User',
      numeric: false,
      sortable: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      sortable: true,
    },
  ];

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'amount',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const rowData = [];

  if (!isLoading) {
    const holdersMap = calculateHoldings(data);

    console.log(holdersMap);
  }

  return (
    <div className="holders-tab">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={rowData}
      />
    </div>
  );
};
