import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { APIOrderDirection } from 'helpers/constants';
import React from 'react';
import { useGetXPs } from 'state/api/user';
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

const XPTable = () => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'rank',
    initialSortDirection: APIOrderDirection.Asc,
  });

  const { data = [] } = useGetXPs({});

  const rankings = [...data].map((rank) => ({
    id: rank.creator || 0,
    username: rank.creator_profile?.name || DEFAULT_NAME,
    xp: rank.creator_xp_points || 0,
  }));
  rankings.sort((a, b) => b.xp - a.xp);

  return (
    <section className="XPTable">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={rankings}
      />
    </section>
  );
};

export default XPTable;
