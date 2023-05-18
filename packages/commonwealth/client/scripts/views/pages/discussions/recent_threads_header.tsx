import { parseCustomStages, threadStageToLabel } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import useForceRerender from 'hooks/useForceRerender';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/discussions/recent_threads_header.scss';
import React, { useEffect, useState } from 'react';
import { matchRoutes } from 'react-router-dom';
import app from 'state';
import { Modal } from 'views/components/component_kit/cw_modal';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import type Topic from '../../../models/Topic';
import { ThreadStage } from '../../../models/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { Select } from '../../components/Select';

type RecentThreadsHeaderProps = {
  stage: string;
  topic: string;
  featuredFilter: string;
  dateRange: string;
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

  const topics = app.topics.getByCommunity(app.activeChainId());

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
      {isUndefined(topic) && (
        <>
          <div className="header-row">
            <CWText type="h3" fontWeight="semiBold" className="header-text">
              All Discussions
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
                    navigate('/new/discussion');
                  }}
                  disabled={!app.user.activeAccount}
                />
              )}
            </div>
          </div>
          <CWText className="subheader-text">
            This section is for the community to discuss how to manage the
            community treasury and spending on contributor grants, community
            initiatives, liquidity mining and other programs.
          </CWText>
        </>
      )}
      {app.chain?.meta && (
        <div className="buttons-row">
          <p className="filter-label">Sort</p>
          <Select
            selected={featuredFilter || 'newest'}
            onSelect={(item: any) => {
              onFilterSelect({
                filterKey: 'featured',
                filterVal: item.value,
              });
            }}
            options={[
              {
                id: 1,
                value: 'newest',
                label: 'Newest',
                iconLeft: 'sparkle',
              },
              {
                id: 2,
                value: 'oldest',
                label: 'Oldest',
                iconLeft: 'clockCounterClockwise',
              },
              {
                id: 3,
                value: 'likes',
                label: 'Likes',
                iconLeft: 'heart',
              },
              {
                id: 4,
                value: 'comments',
                label: 'Comments',
                iconLeft: 'chatDots',
              },
            ]}
          />

          <p style={{ marginLeft: 'auto' }}></p>
          <p className="filter-label">Filter</p>
          {topics.length > 0 && (
            <Select
              selected={
                matchesDiscussionsTopicRoute?.[0]?.params?.topic || 'All Topics'
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
              dropdownPosition="bottom-end"
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
                    s === ThreadStage.Voting ? app.threads.numVotingThreads : ''
                  }`,
                })),
              ]}
              dropdownPosition="bottom-end"
            />
          )}
          <Select
            selected={dateRange || 'allTime'}
            onSelect={(item: any) => {
              onFilterSelect({
                filterKey: 'dateRange',
                filterVal: item.value,
              });
            }}
            options={[
              {
                id: 1,
                value: 'allTime',
                label: 'All Time',
              },
              {
                id: 2,
                value: 'month',
                label: 'Month',
              },
              {
                id: 3,
                value: 'week',
                label: 'Week',
              },
            ]}
            dropdownPosition="bottom-end"
          />
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
