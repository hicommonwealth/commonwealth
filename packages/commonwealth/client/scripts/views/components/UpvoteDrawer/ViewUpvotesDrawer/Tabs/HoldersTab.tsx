import { APIOrderDirection } from 'client/scripts/helpers/constants';
import React from 'react';
import { CWTable } from '../../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../../component_kit/new_designs/CWTable/useCWTableState';

export const HoldersTab = () => {
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
