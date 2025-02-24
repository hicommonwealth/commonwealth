import { splitAndDecodeURL } from '@hicommonwealth/shared';
import { APIOrderDirection } from 'client/scripts/helpers/constants';
import useRunOnceOnCondition from 'client/scripts/hooks/useRunOnceOnCondition';
import useTopicGating from 'client/scripts/hooks/useTopicGating';
import { ThreadFeaturedFilterTypes } from 'client/scripts/models/types';
import useUserStore from 'client/scripts/state/ui/user';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useFetchThreadsQuery } from 'state/api/threads';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTable } from '../../components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../components/component_kit/new_designs/CWTable/useCWTableState';
import '../discussions/DiscussionsPage.scss';
import { PageLoading } from '../loading';
import ThreadCell from './ThreadCell';
import './index.scss';

type OverViewPageProps = {
  topicId?: string | number | undefined;
  featuredFilter?: ThreadFeaturedFilterTypes;
  timelineFilter?: {
    toDate: string;
    fromDate: string | null;
  };
};

const OverviewPage = ({
  topicId,
  featuredFilter,
  timelineFilter,
}: OverViewPageProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const topicNameFromURL = splitAndDecodeURL(location.pathname);

  useRunOnceOnCondition({
    callback: () => {
      if (topicNameFromURL === 'overview') {
        const params = new URLSearchParams();
        params.set('tab', 'overview');
        const url = `/discussions?${params.toString()}`;
        navigate(url);
      }
    },
    shouldRun: topicNameFromURL === 'overview',
  });

  const communityId = app.activeChainId() || '';
  const { data: recentlyActiveThreads } = useFetchThreadsQuery({
    queryType: 'active',
    communityId,
    topicsPerThread: 3,
    withXRecentComments: 3,
    apiEnabled: !!communityId,
  });

  const { memberships, topicPermissions } = useTopicGating({
    communityId: communityId,
    userAddress: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address && !!communityId,
  });

  const filterList = useMemo(() => {
    let newData = recentlyActiveThreads || []; // Start with full data

    if (topicId) {
      newData = newData.filter((thread) => thread.topic.id === topicId);
    }
    if (timelineFilter) {
      if (
        timelineFilter &&
        timelineFilter?.fromDate &&
        timelineFilter?.toDate
      ) {
        const { fromDate, toDate } = timelineFilter;
        const from = new Date(fromDate);
        const to = new Date(toDate);

        newData = newData.filter((thread) => {
          const threadDate = new Date(thread.createdAt);
          return threadDate >= from && threadDate <= to;
        });
      }
    }
    if (featuredFilter) {
      newData = [...newData].sort((a, b) => {
        // Spread to avoid mutating original array
        switch (featuredFilter) {
          case ThreadFeaturedFilterTypes.Newest:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

          case ThreadFeaturedFilterTypes.Oldest:
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

          case ThreadFeaturedFilterTypes.MostLikes:
            return (b.reactionCount ?? 0) - (a.reactionCount ?? 0);

          case ThreadFeaturedFilterTypes.MostComments:
            return (b.numberOfComments ?? 0) - (a.numberOfComments ?? 0);

          case ThreadFeaturedFilterTypes.LatestActivity:
            return (
              new Date(b.lastActivityAt).getTime() -
              new Date(a.lastActivityAt).getTime()
            );

          default:
            return 0;
        }
      });
    }

    return newData;
  }, [topicId, featuredFilter, recentlyActiveThreads, timelineFilter]);

  const columns: CWTableColumnInfo[] = [
    {
      key: 'title',
      header: 'Title',
      hasCustomSortValue: true,
      numeric: false,
      sortable: true,
    },
    {
      key: 'topic',
      header: 'Topic',
      hasCustomSortValue: false,
      numeric: false,
      sortable: true,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      numeric: false,
      sortable: true,
    },
    {
      key: 'viewCount',
      header: 'Views',
      numeric: false,
      sortable: true,
    },
  ];
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'createdAt',
    initialSortDirection: APIOrderDirection.Desc,
  });

  return !recentlyActiveThreads?.length ? (
    <PageLoading />
  ) : (
    <div className="OverviewPage">
      <CWTable
        rowData={filterList.map((thread) => ({
          ...thread,
          createdAt: {
            sortValue: thread.createdAt,
            customElement: (
              <div className="createdAt">
                <CWText fontWeight="regular">
                  {moment(thread.createdAt)
                    .utc?.()
                    ?.local?.()
                    ?.format('MMMM DD YYYY')}
                </CWText>
              </div>
            ),
          },
          title: {
            customElement: (
              <>
                <ThreadCell
                  thread={thread}
                  memberships={memberships}
                  topicPermissions={topicPermissions}
                />
              </>
            ),
          },
          topic: {
            customElement: (
              <Link
                key={thread.topic.name}
                to={`${window.location.pathname}/${thread.topic.name}`}
              >
                <CWText className="collaborator-user-name">
                  {thread.topic.name}
                </CWText>
              </Link>
            ),
          },
        }))}
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
      />
    </div>
  );
};

export default OverviewPage;
