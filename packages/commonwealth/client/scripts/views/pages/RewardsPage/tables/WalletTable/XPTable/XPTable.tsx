import { APIOrderDirection } from 'helpers/constants';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import './XPTable.scss';

const columns: CWTableColumnInfo[] = [
  {
    key: 'rank',
    header: 'Rank',
    numeric: false,
    sortable: true,
  },
  {
    key: 'username',
    header: 'Username',
    numeric: false,
    sortable: true,
  },
  {
    key: 'xp',
    header: () => (
      <CWText className="table-header">
        <CWIcon iconName="help" iconSize="regular" /> XP
      </CWText>
    ),
    numeric: true,
    sortable: true,
  },
];

const sampleData = [
  {
    rank: 1,
    username: 'Commoner.eth',
    xp: 126,
  },
  {
    rank: 2,
    username: 'Commoner.eth',
    xp: 125,
  },
  {
    rank: 3,
    username: 'Commoner.eth',
    xp: 124,
  },
  {
    rank: 4,
    username: 'Commoner.eth',
    xp: 123,
  },
  {
    rank: 5,
    username: 'Commoner.eth',
    xp: 122,
  },
  {
    rank: 6,
    username: 'Commoner.eth',
    xp: 121,
  },
  {
    rank: 7,
    username: 'Commoner.eth',
    xp: 120,
  },
  {
    rank: 8,
    username: 'Commoner.eth',
    xp: 119,
  },
];

const XPTable = () => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'rank',
    initialSortDirection: APIOrderDirection.Asc,
  });

  return (
    <section className="XPTable">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={sampleData}
      />
    </section>
  );
};

export default XPTable;
