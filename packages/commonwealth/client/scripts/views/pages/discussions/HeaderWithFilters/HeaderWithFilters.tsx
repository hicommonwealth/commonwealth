import { parseCustomStages, threadStageToLabel } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useRef, useState } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import useEXCEPTION_CASE_threadCountersStore from 'state/ui/thread';
import {
  CommunityStakeBanner,
  useCommunityStake,
} from 'views/components/CommunityStake';
import DismissStakeBannerModal from 'views/components/CommunityStake/DismissStakeBannerModal';
import { Select } from 'views/components/Select';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import { useFlag } from '../../../../hooks/useFlag';
import type Topic from '../../../../models/Topic';
import {
  ThreadFeaturedFilterTypes,
  ThreadStage,
  ThreadTimelineFilterTypes,
} from '../../../../models/types';

import { QuillRenderer } from 'client/scripts/views/components/react_quill_editor/quill_renderer';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import useCommunityStakeStore from 'state/ui/communityStake';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import './HeaderWithFilters.scss';

type HeaderWithFiltersProps = {
  stage: string;
  topic: string;
  featuredFilter: ThreadFeaturedFilterTypes;
  dateRange: ThreadTimelineFilterTypes;
  totalThreadCount: number;
  isIncludingSpamThreads: boolean;
  onIncludeSpamThreads: (includeSpams: boolean) => any;
  isIncludingArchivedThreads: boolean;
  onIncludeArchivedThreads: (includeArchived: boolean) => any;
  isOnArchivePage?: boolean;
};

export const HeaderWithFilters = ({
  stage,
  topic,
  featuredFilter,
  dateRange,
  totalThreadCount,
  isIncludingSpamThreads,
  onIncludeSpamThreads,
  isIncludingArchivedThreads,
  onIncludeArchivedThreads,
  isOnArchivePage,
}: HeaderWithFiltersProps) => {
  const communityStakeEnabled = useFlag('communityStake');
  const contestsEnabled = useFlag('contest');
  const navigate = useCommonNavigate();
  const location = useLocation();
  const [topicSelectedToEdit, setTopicSelectedToEdit] = useState<Topic>(null);
  const [isDismissStakeBannerModalOpen, setIsDismissStakeBannerModalOpen] =
    useState(false);
  const forceRerender = useForceRerender();
  const filterRowRef = useRef<HTMLDivElement>();
  const [rightFiltersDropdownPosition, setRightFiltersDropdownPosition] =
    useState<'bottom-end' | 'bottom-start'>('bottom-end');

  const { isLoggedIn } = useUserLoggedIn();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();
  const { totalThreadsInCommunityForVoting } =
    useEXCEPTION_CASE_threadCountersStore();
  const { stakeEnabled } = useCommunityStake();
  const { dismissBanner, isBannerVisible } = useCommunityStakeStore();
  const { isContestAvailable, contestsData } = useCommunityContests();

  const onFilterResize = () => {
    if (filterRowRef.current) {
      setRightFiltersDropdownPosition(
        filterRowRef.current.clientHeight > 40 ? 'bottom-start' : 'bottom-end',
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

  const { isWindowExtraSmall } = useBrowserWindow({});

  useEffect(() => {
    app.loginStateEmitter.on('redraw', forceRerender);

    return () => {
      app.loginStateEmitter.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  const { stagesEnabled, customStages } = app.chain?.meta || {};

  const { data: topics } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const urlParams = Object.fromEntries(
    new URLSearchParams(window.location.search),
  );

  const featuredTopics = (topics || [])
    .filter((t) => t.featuredInSidebar)
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => a.order - b.order);

  const otherTopics = (topics || [])
    .filter((t) => !t.featuredInSidebar)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedTopic = (topics || []).find((t) => topic && topic === t.name);

  const contestNameOptions = (contestsData || []).map((contest) => ({
    label: contest?.name,
    value: contest?.name,
    id: contest?.contest_address,
    type: 'contest',
  }));

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
    location,
  );

  const matchesContestFilterRoute = urlParams.contest;

  const matchesArchivedRoute = matchRoutes(
    [{ path: '/archived' }, { path: ':scope/archived' }],
    location,
  );

  const onFilterSelect = ({
    pickedTopic = matchesDiscussionsTopicRoute?.[0]?.params?.topic || '',
    filterKey = '',
    filterVal = '',
  }) => {
    urlParams[filterKey] = filterVal;

    if (filterVal === '') {
      delete urlParams[filterKey];
    }

    if (matchesArchivedRoute && !pickedTopic) {
      navigate(
        `/archived?` +
          Object.keys(urlParams)
            .map((x) => `${x}=${urlParams[x]}`)
            .join('&'),
      );
    } else if (filterKey === 'contest') {
      navigate(
        `/discussions?` +
          Object.keys(urlParams)
            .map((param) => {
              if (param === 'stage') {
                return false;
              }
              return `${param}=${urlParams[param]}`;
            })
            .filter(Boolean)
            .join('&'),
      );
    } else {
      navigate(
        `/discussions${pickedTopic ? `/${pickedTopic}` : ''}?` +
          Object.keys(urlParams)
            .map((param) => {
              if (pickedTopic && (param === 'contest' || param === 'status')) {
                return false;
              }
              return `${param}=${urlParams[param]}`;
            })
            .filter(Boolean)
            .join('&'),
      );
    }
  };

  const handleDismissStakeBannerModal = (
    dismissForThisCommunity: boolean,
    dismissForAnyCommunity: boolean,
  ) => {
    setIsDismissStakeBannerModalOpen(false);

    dismissBanner({
      communityId: app.activeChainId(),
      communityDismissal: dismissForThisCommunity,
      allCommunitiesDismissal: dismissForAnyCommunity,
    });
  };

  const stakeBannerEnabled =
    isLoggedIn &&
    communityStakeEnabled &&
    stakeEnabled &&
    isBannerVisible(app.activeChainId());

  const contestFiltersVisible = contestsEnabled && isContestAvailable;

  return (
    <div className="HeaderWithFilters">
      {stakeBannerEnabled && (
        <CommunityStakeBanner
          onClose={() => setIsDismissStakeBannerModalOpen(true)}
        />
      )}

      <div className="header-row">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          {isUndefined(topic)
            ? isOnArchivePage
              ? 'Archived'
              : 'All Discussions'
            : topic}
        </CWText>
        <div className="count-and-button">
          <CWText
            type="caption"
            fontWeight="medium"
            className="thread-count-text"
          >
            {totalThreadCount} Threads
          </CWText>
          {!isWindowExtraSmall && (
            <CWButton
              buttonType="primary"
              buttonHeight="sm"
              label="Create thread"
              iconLeft="plus"
              onClick={() => {
                navigate(
                  `/new/discussion${
                    topic ? `?topic=${selectedTopic?.id}` : ''
                  }`,
                );
              }}
              disabled={!hasJoinedCommunity}
            />
          )}
        </div>
      </div>

      {selectedTopic?.description && (
        <QuillRenderer
          doc={selectedTopic.description}
          customClass="subheader-text"
        />
      )}

      {isOnArchivePage && (
        <CWText className="subheader-text">
          This section is for all archived posts. Archived posts will always be
          visible here and can be linked to new thread posts, but they can’t be
          upvoted or receive new comments.
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
                  label: 'Upvotes',
                  iconLeft: 'upvote',
                },
                {
                  id: 4,
                  value: ThreadFeaturedFilterTypes.MostComments,
                  label: 'Comments',
                  iconLeft: 'chatDots',
                },
                {
                  id: 5,
                  value: ThreadFeaturedFilterTypes.LatestActivity,
                  label: 'Latest Activity',
                  iconLeft: 'bellRinging',
                },
              ]}
            />
          </div>

          <div className="filter-section filter-section-top">
            <p className="filter-label">Filter</p>
            <div className="filter-section filter-section-right">
              {(topics || []).length > 0 && (
                <Select
                  selected={
                    matchesContestFilterRoute ||
                    matchesDiscussionsTopicRoute?.[0]?.params?.topic ||
                    'All Topics'
                  }
                  onSelect={(item) => {
                    if (typeof item === 'string') {
                      // All topics
                      onFilterSelect({ pickedTopic: '' });
                      return;
                    }

                    if (item.type === 'contest') {
                      onFilterSelect({
                        filterKey: 'contest',
                        filterVal: item.value,
                        pickedTopic: '',
                      });
                      return;
                    }

                    onFilterSelect({ pickedTopic: item.value });
                  }}
                  options={[
                    ...(contestFiltersVisible
                      ? [{ type: 'header', label: 'Topics' }]
                      : []),
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
                    ...(contestFiltersVisible
                      ? [
                          { type: 'header-divider', label: 'Contests' },
                          ...contestNameOptions,
                        ]
                      : []),
                  ]}
                  dropdownPosition={rightFiltersDropdownPosition}
                  canEditOption={app.roles?.isAdminOfEntity({
                    community: app.activeChainId(),
                  })}
                  onOptionEdit={(item: any) =>
                    setTopicSelectedToEdit(
                      [...featuredTopics, ...otherTopics].find(
                        (x) => x.id === item.id,
                      ),
                    )
                  }
                />
              )}
              {matchesContestFilterRoute ? (
                <Select
                  selected={urlParams.status || 'all-statuses'}
                  onSelect={(item: any) =>
                    onFilterSelect({
                      filterKey: 'status',
                      filterVal:
                        item.value === 'all-statuses' ? '' : item.value,
                    })
                  }
                  options={[
                    {
                      id: 0,
                      label: 'Active',
                      value: 'active',
                    },
                    {
                      id: 1,
                      label: 'Past winners',
                      value: 'past-winners',
                    },
                    {
                      id: 2,
                      label: 'All Statuses',
                      value: 'all-statuses',
                    },
                  ]}
                  dropdownPosition={rightFiltersDropdownPosition}
                />
              ) : (
                stagesEnabled && (
                  <Select
                    selected={selectedStage || 'All Stages'}
                    onSelect={(item) =>
                      onFilterSelect({
                        filterKey: 'stage',
                        filterVal:
                          typeof item !== 'string'
                            ? item.value === 'All Stages'
                              ? ''
                              : item.value
                            : '',
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
                            ? totalThreadsInCommunityForVoting
                            : ''
                        }`,
                      })),
                    ]}
                    dropdownPosition={rightFiltersDropdownPosition}
                  />
                )
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

      <div className="checkboxes">
        <CWCheckbox
          checked={isIncludingSpamThreads}
          label="Include posts flagged as spam"
          onChange={(e) => {
            onIncludeSpamThreads(e.target.checked);
          }}
        />

        {!isOnArchivePage && (
          <CWCheckbox
            checked={isIncludingArchivedThreads}
            label="Include archived posts"
            onChange={(e) => {
              onIncludeArchivedThreads(e.target.checked);
            }}
          />
        )}
      </div>

      <CWModal
        size="medium"
        content={
          <EditTopicModal
            topic={topicSelectedToEdit}
            onModalClose={() => setTopicSelectedToEdit(null)}
          />
        }
        onClose={() => setTopicSelectedToEdit(null)}
        open={!!topicSelectedToEdit}
      />
      <CWModal
        size="small"
        content={
          <DismissStakeBannerModal
            onModalClose={() => setIsDismissStakeBannerModalOpen(false)}
            onDismiss={handleDismissStakeBannerModal}
          />
        }
        onClose={() => setIsDismissStakeBannerModalOpen(false)}
        open={isDismissStakeBannerModalOpen}
      />
    </div>
  );
};
