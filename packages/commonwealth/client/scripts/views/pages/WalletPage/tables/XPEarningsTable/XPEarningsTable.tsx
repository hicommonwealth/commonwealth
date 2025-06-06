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
import {
  CWTag,
  TagType,
} from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { QuestAction } from '../../../CreateQuest/QuestForm/QuestActionSubForm';
import './XPEarningsTable.scss';
import { getTagConfigForRewardType } from './helpers';

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
    key: 'rewardType',
    header: 'Reward Type',
    numeric: false,
    sortable: true,
  },
  {
    key: 'auraAmount',
    header: 'Aura Amount',
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
    user_or_creator_id: 377074,
    // user_or_creator_id: user.id,
  });

  let totalReferrerAura = 0;

  const tableData = xpLogs
    .map((log) => {
      const config = getTagConfigForRewardType({
        action: log.event_name as QuestAction,
        auth_user_id: 377074,
        log: {
          creator_id: log.creator_user_id,
          user_id: log.user_id,
        },
      });

      // filter out events different than refferals
      if (config.type !== 'trending') {
        return false;
      }

      totalReferrerAura += log.xp_points;

      return {
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
        rewardType: {
          customElement: (() => {
            return (
              <CWTag
                classNames="rewardType"
                type={config.type as TagType}
                label={config.copy}
              />
            );
          })(),
        },
        auraAmount: log.xp_points,
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
      };
    })
    .filter(Boolean);

  console.log('totalReferrerAura', totalReferrerAura);

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
