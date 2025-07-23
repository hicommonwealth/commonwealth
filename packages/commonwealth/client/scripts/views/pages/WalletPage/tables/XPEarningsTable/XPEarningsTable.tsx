import { QuestEvents, XpLogView } from '@hicommonwealth/schemas';
import { splitCamelOrPascalCase } from 'client/scripts/helpers/string';
import { APIOrderDirection } from 'helpers/constants';
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
import { FullUser } from 'views/components/user/fullUser';
import z from 'zod';
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
    key: 'completedBy',
    header: 'Completed By',
    numeric: false,
    sortable: false,
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

function buildActionLink(log: z.infer<typeof XpLogView>) {
  if (log.event_name === 'XpAwarded') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CWIcon
          iconName="trophy"
          iconSize="small"
          style={{ color: '#FFD700' }}
        />
        {log.scope?.award_reason}
      </span>
    );
  }
  const title = splitCamelOrPascalCase(log.event_name);
  if (log.scope) {
    switch (log.event_name as keyof typeof QuestEvents) {
      case 'CommunityCreated':
      case 'CommunityJoined':
      case 'CommunityGoalReached':
      case 'NamespaceLinked':
      case 'MembershipsRefreshed':
        return log.scope.community_id ? (
          <a
            href={`/${log.scope.community_id}`}
            target="_blank"
            rel="noreferrer"
          >
            {title}
          </a>
        ) : (
          title
        );
      case 'ThreadCreated':
      case 'ThreadUpvoted':
        return log.scope.community_id && log.scope.thread_id ? (
          <a
            href={`/${log.scope.community_id}/discussions/${log.scope.thread_id}`}
            target="_blank"
            rel="noreferrer"
          >
            {title}
          </a>
        ) : (
          title
        );
      case 'CommentCreated':
      case 'CommentUpvoted':
        return log.scope.community_id &&
          log.scope.thread_id &&
          log.scope.comment_id ? (
          <a
            href={`/${log.scope.community_id}/discussions/${log.scope.thread_id}?focusComments=true`}
            target="_blank"
            rel="noreferrer"
          >
            {title}
          </a>
        ) : (
          title
        );
    }
  }
  return title;
}

export const XPEarningsTable = () => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'earnTime',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const user = useUserStore();

  const { data: xpLogs = [] } = useGetXPs({
    user_or_creator_id: user.id,
  });

  const tableData = xpLogs.map((log) => ({
    action: buildActionLink(log),
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
        const config = getTagConfigForRewardType(log);
        return (
          <CWTag
            classNames="rewardType"
            type={config.type as TagType}
            label={config.copy}
          />
        );
      })(),
    },
    completedBy: {
      customElement:
        log.is_creator && log.user_id !== user.id ? (
          <FullUser
            profile={{
              address: '',
              avatarUrl: log?.user_profile?.avatar_url || '',
              lastActive: '',
              name: log?.user_profile?.name || '',
              userId: log.user_id || 0,
            }}
            userAddress=""
            userCommunityId="common"
            shouldLinkProfile
          />
        ) : (
          <></>
        ),
    },
    auraAmount:
      (user.id === log.user_id ? log.xp_points : 0) +
      (user.id === log.creator_user_id ? log.creator_xp_points || 0 : 0),
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
