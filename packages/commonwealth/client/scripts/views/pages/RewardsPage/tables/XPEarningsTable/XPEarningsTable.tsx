import { APIOrderDirection } from 'helpers/constants';
import { splitCamelOrPascalCase } from 'helpers/string';
import moment from 'moment';
import React from 'react';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import {
  CWTable,
  CWTableColumnInfo,
} from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './XPEarningsTable.scss';

const columns: CWTableColumnInfo[] = [
  {
    key: 'action',
    header: 'Action',
    numeric: false,
    sortable: true,
  },
  {
    key: 'earnTime',
    header: 'Earn Time',
    numeric: false,
    sortable: true,
  },
  {
    key: 'xpAmount',
    header: 'XP Amount',
    numeric: true,
    sortable: true,
  },
  {
    key: 'questLink',
    header: 'Link to Quest',
    numeric: false,
    sortable: false,
  },
];

export const XPEarningsTable = () => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'earnTime',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const user = useUserStore();

  const { data: xpLogs = [] } = useGetXPs({
    user_id: user.id,
  });

  const tableData = xpLogs.map((log) => ({
    action: splitCamelOrPascalCase(log.event_name),
    earnTime: {
      customElement: withTooltip(
        <CWTag
          type="group"
          label={moment(log.created_at).format('DD/MM/YYYY')}
          classNames="cursor-pointer"
        />,
        moment(log.event_created_at).toLocaleString(),
        true,
      ),
    },
    xpAmount: log.xp_points,
    questLink: {
      customElement: (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${window.location.origin}/quests/${log.quest_id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <CWIcon iconName="externalLink" className="questLink" />
        </a>
      ),
    },
  }));

  return (
    <div className="XPEarningsTable">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={tableData}
      />
    </div>
  );
};
