import { parseCustomStages, threadStageToLabel } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import useForceRerender from 'hooks/useForceRerender';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/recent_threads_header.scss';
import React, { useEffect, useRef, useState } from 'react';
import { matchRoutes } from 'react-router-dom';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import { Modal } from 'views/components/component_kit/cw_modal';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import useBrowserWindow from '../../../hooks/useBrowserWindow';
import type Topic from '../../../models/Topic';
import {
  ThreadFeaturedFilterTypes,
  ThreadStage,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { Select } from '../../components/Select';

type RecentThreadsHeaderProps = {
  stage: string;
  topic: string;
  featuredFilter: ThreadFeaturedFilterTypes;
  dateRange: ThreadTimelineFilterTypes;
  totalThreadCount: number;
};

export const RecentThreadsHeader = ({
  stage,
  topic,
  featuredFilter,
  dateRange,
  totalThreadCount,
}: RecentThreadsHeaderProps) => {
  const navigate = useCommonNavigate();
  const [topicSelectedToEdit, setTopicSelectedToEdit] = useState<Topic>(null);
  const forceRerender = useForceRerender();
  const filterRowRef = useRef<HTMLDivElement>();
  const [rightFiltersDropdownPosition, setRightFiltersDropdownPosition] =
    useState<'bottom-end' | 'bottom-start'>('bottom-end');

  const onFilterResize = () => {
    if (filterRowRef.current) {
      setRightFiltersDropdownPosition(
        filterRowRef.current.clientHeight > 40 ? 'bottom-start' : 'bottom-end'
      );
    }
  };

  useBrowserWindow({
    onResize: onFilterResize,
    resizeListenerUpdateDeps: [],
  });

  useEffect(() => {
    onFilterResize();
  }, []);

  const [windowIsExtraSmall, setWindowIsExtraSmall] = useState(
    isWindowExtraSmall(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => {
      setWindowIsExtraSmall(isWindowExtraSmall(window.innerWidth));
    };

    window.addEventListener('resize', onResize);
    app.loginStateEmitter.on('redraw', forceRerender);
    app.user.isFetched.on('redraw', forceRerender);

    return () => {
      window.removeEventListener('resize', onResize);
      app.loginStateEmitter.off('redraw', forceRerender);
      app.user.isFetched.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  const { stagesEnabled, customStages } = app.chain?.meta || {};

  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });

  const featuredTopics = topics
    .filter((t) => t.featuredInSidebar)
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => a.order - b.order);

  const otherTopics = topics
    .filter((t) => !t.featuredInSidebar)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedTopic = topics.find((t) => topic && topic === t.name);

  const stages = !customStages
    ? [
        ThreadStage.Discussion,
        ThreadStage.ProposalInReview,
        ThreadStage.Voting,
        ThreadStage.Passed,
        ThreadStage.Failed,
      ]
    : parseCustomStages(customStages);

  const selectedStage = stages.find((s) => s === (stage as ThreadStage));

  const matchesDiscussionsTopicRoute = matchRoutes(
    [{ path: '/discussions/:topic' }, { path: ':scope/discussions/:topic' }],
    location
  );

  const onFilterSelect = ({
    pickedTopic = matchesDiscussionsTopicRoute?.[0]?.params?.topic || '',
    filterKey = '',
    filterVal = '',
  }) => {
    if (
      filterKey === 'featured' &&
      filterVal !== (featuredFilter || ThreadFeaturedFilterTypes.Newest)
    ) {
      // Remove threads from state whenever the featured filter changes
      // This prevents the situation when we have less data in state and
      // we use that to show the applied featured filter data which would
      // not be accurate - whenever "featured" filter changes we have to
      // refetch fresh threads data from api.
      app.threads.store.clear();
      app.threads.listingStore.clear();
      app.threads.numTotalThreads = 0;
    }

    const urlParams = Object.fromEntries(
      new URLSearchParams(window.location.search)
    );
    urlParams[filterKey] = filterVal;

    if (filterVal === '') {
      delete urlParams[filterKey];
    }

    navigate(
      `/discussions${pickedTopic ? `/${pickedTopic}` : ''}?` +
        Object.keys(urlParams)
          .map((x) => `${x}=${urlParams[x]}`)
          .join('&')
    );
  };

  return (
    <div className="RecentThreadsHeader">
      <div className="header-row">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          {isUndefined(topic) ? 'All Discussions' : topic}
        </CWText>
        <div className="count-and-button">
          <CWText
            type="caption"
            fontWeight="medium"
            className="thread-count-text"
          >
            {totalThreadCount} Threads
          </CWText>
          {windowIsExtraSmall ? (
            <CWIconButton
              iconName="plusCircle"
              iconButtonTheme="black"
              onClick={() => {
                navigate('/new/discussion');
              }}
              disabled={!app.user.activeAccount}
            />
          ) : (
            <CWButton
              buttonType="mini-black"
              label="Create Thread"
              iconLeft="plus"
              onClick={() => {
                navigate(
                  `/new/discussion${topic ? `?topic=${selectedTopic?.id}` : ''}`
                );
              }}
              disabled={!app.user.activeAccount}
            />
          )}
        </div>
      </div>

      {(isUndefined(topic) || selectedTopic?.description) && (
        <CWText className="subheader-text">
          {isUndefined(topic)
            ? `This section is for the community to discuss how to manage the
          community treasury and spending on contributor grants, community
          initiatives, liquidity mining and other programs.`
            : selectedTopic?.description}
        </CWText>
      )}

      {app.chain?.meta && (
        <div className="filter-row" ref={filterRowRef}>
          <div className="filter-section">
            <p className="filter-label">Sort</p>
            <Select
              selected={featuredFilter || ThreadFeaturedFilterTypes.Newest}
              onSelect={(item: any) => {
                onFilterSelect({
                  filterKey: 'featured',
                  filterVal: item.value as ThreadFeaturedFilterTypes,
                });
              }}
              options={[
                {
                  id: 1,
                  value: ThreadFeaturedFilterTypes.Newest,
                  label: 'Newest',
                  iconLeft: 'sparkle',
                },
                {
                  id: 2,
                  value: ThreadFeaturedFilterTypes.Oldest,
                  label: 'Oldest',
                  iconLeft: 'clockCounterClockwise',
                },
                {
                  id: 3,
                  value: ThreadFeaturedFilterTypes.MostLikes,
                  label: 'Likes',
                  iconLeft: 'heart',
                },
                {
                  id: 4,
                  value: ThreadFeaturedFilterTypes.MostComments,
                  label: 'Comments',
                  iconLeft: 'chatDots',
                },
              ]}
            />
          </div>

          <div className="filter-section filter-section-top">
            <p className="filter-label">Filter</p>
            <div className="filter-section filter-section-right">
              {topics.length > 0 && (
                <Select
                  selected={
                    matchesDiscussionsTopicRoute?.[0]?.params?.topic ||
                    'All Topics'
                  }
                  onSelect={(item: any) =>
                    onFilterSelect({
                      pickedTopic: item === 'All Topics' ? '' : item.value,
                    })
                  }
                  options={[
                    {
                      id: 0,
                      label: 'All Topics',
                      value: 'All Topics',
                    },
                    ...[...featuredTopics, ...otherTopics].map((t) => ({
                      id: t.id,
                      value: t.name,
                      label: t.name,
                    })),
                  ]}
                  dropdownPosition={rightFiltersDropdownPosition}
                  canEditOption={app.roles?.isAdminOfEntity({
                    chain: app.activeChainId(),
                  })}
                  onOptionEdit={(item: any) =>
                    setTopicSelectedToEdit(
                      [...featuredTopics, ...otherTopics].find(
                        (x) => x.id === item.id
                      )
                    )
                  }
                />
              )}
              {stagesEnabled && (
                <Select
                  selected={selectedStage || 'All Stages'}
                  onSelect={(item: any) =>
                    onFilterSelect({
                      filterKey: 'stage',
                      filterVal: item.value === 'All Stages' ? '' : item.value,
                    })
                  }
                  options={[
                    {
                      id: 0,
                      label: 'All Stages',
                      value: 'All Stages',
                    },
                    ...stages.map((s) => ({
                      id: s,
                      value: s,
                      label: `${threadStageToLabel(s)} ${
                        s === ThreadStage.Voting
                          ? app.threads.numVotingThreads
                          : ''
                      }`,
                    })),
                  ]}
                  dropdownPosition={rightFiltersDropdownPosition}
                />
              )}
              <Select
                selected={dateRange || ThreadTimelineFilterTypes.AllTime}
                onSelect={(item: any) => {
                  onFilterSelect({
                    filterKey: 'dateRange',
                    filterVal: item.value as ThreadTimelineFilterTypes,
                  });
                }}
                options={[
                  {
                    id: 1,
                    value: ThreadTimelineFilterTypes.AllTime,
                    label: 'All Time',
                  },
                  {
                    id: 2,
                    value: ThreadTimelineFilterTypes.ThisMonth,
                    label: 'Month',
                  },
                  {
                    id: 3,
                    value: ThreadTimelineFilterTypes.ThisWeek,
                    label: 'Week',
                  },
                ]}
                dropdownPosition={rightFiltersDropdownPosition}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        content={
          <EditTopicModal
            topic={topicSelectedToEdit}
            onModalClose={() => setTopicSelectedToEdit(null)}
          />
        }
        onClose={() => setTopicSelectedToEdit(null)}
        open={!!topicSelectedToEdit}
      />
    </div>
  );
};
