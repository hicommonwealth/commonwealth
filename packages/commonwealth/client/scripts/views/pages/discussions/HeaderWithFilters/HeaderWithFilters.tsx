import { parseCustomStages, threadStageToLabel } from 'helpers';
import { isUndefined } from 'helpers/typeGuards';
import useBrowserWindow from 'hooks/useBrowserWindow';
import moment from 'moment/moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useRef, useState } from 'react';
import { matchRoutes, useLocation, useSearchParams } from 'react-router-dom';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import MarkdownViewerUsingQuillOrNewEditor from 'views/components/MarkdownViewerWithFallback';
import { Select } from 'views/components/Select';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import ContestCard from 'views/pages/CommunityManagement/Contests/ContestsList/ContestCard';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import type { Topic } from '../../../../models/Topic';
import {
  ThreadFeaturedFilterTypes,
  ThreadStage,
  ThreadTimelineFilterTypes,
  ThreadViewFilterTypes,
} from '../../../../models/types';
import './HeaderWithFilters.scss';

type TabsProps = {
  label: string;
  value: string;
};

type ViewType = {
  id: number;
  value: string;
  label: string;
  iconLeft: string;
};
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
  activeContests: Contest[];
  views?: TabsProps[];
  selectedView?: string;
  setSelectedView?: (tabValue: string) => void;
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
  activeContests,
  views,
  selectedView,
  setSelectedView,
}: HeaderWithFiltersProps) => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const [topicSelectedToEdit, setTopicSelectedToEdit] = useState<
    Topic | undefined
  >();

  const filterRowRef = useRef<HTMLDivElement>();
  const [rightFiltersDropdownPosition, setRightFiltersDropdownPosition] =
    useState<'bottom-end' | 'bottom-start'>('bottom-end');

  const { isContestAvailable, contestsData } = useCommunityContests();

  const { data: community } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
    includeNodeInfo: true,
  });

  const user = useUserStore();

  const [searchParams] = useSearchParams();
  const contestAddress = searchParams.get('contest');

  const createButtonText =
    activeContests?.length || contestAddress ? 'Create' : 'Create thread';

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

  const { stages_enabled, custom_stages } = app.chain?.meta || {};

  const communityId = app.activeChainId() || '';
  const { data: topics } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const urlParams = Object.fromEntries(
    new URLSearchParams(window.location.search),
  );

  const featuredTopics = (topics || [])
    .filter((t) => t.featured_in_sidebar)
    .sort((a, b) => a.name.localeCompare(b.name))
    // @ts-expect-error <StrictNullChecks/>
    .sort((a, b) => a.order - b.order);

  const otherTopics = (topics || [])
    .filter((t) => !t.featured_in_sidebar)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedTopic = (topics || []).find((t) => topic && topic === t.name);

  const contestNameOptions = (contestsData.all || []).map((contest) => ({
    label: contest?.name,
    value: contest?.contest_address,
    id: contest?.contest_address,
    type: 'contest',
  }));

  const stages = !custom_stages
    ? [
        ThreadStage.Discussion,
        ThreadStage.ProposalInReview,
        ThreadStage.Voting,
        ThreadStage.Passed,
        ThreadStage.Failed,
      ]
    : parseCustomStages(custom_stages);

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

  return (
    <div className="HeaderWithFilters">
      <div className="header-row">
        {!isOnArchivePage && views && views.length ? (
          <div className="filter-section">
            <Select
              selected={selectedView || ThreadViewFilterTypes.All}
              onSelect={(item) => {
                setSelectedView?.((item as ViewType).value);
              }}
              options={[
                {
                  id: 1,
                  value: ThreadViewFilterTypes.All,
                  label: 'Row',
                  iconLeft: 'viewAll',
                },

                {
                  id: 2,
                  value: ThreadViewFilterTypes.Overview,
                  label: 'Overview',
                  iconLeft: 'viewOverView',
                },

                {
                  id: 3,
                  value: ThreadViewFilterTypes.CardView,
                  label: 'ImageView',
                  iconLeft: 'kanban',
                },
              ]}
            />
          </div>
        ) : (
          <CWText type="h3" fontWeight="semiBold" className="header-text">
            {isUndefined(topic)
              ? isOnArchivePage
                ? 'Archived'
                : 'All Discussions'
              : topic}
          </CWText>
        )}
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
              label={createButtonText}
              iconLeft="plus"
              onClick={() => {
                navigate(
                  `/new/discussion${
                    topic ? `?topic=${selectedTopic?.id}` : ''
                  }`,
                );
              }}
              disabled={!user.activeAccount}
            />
          )}
        </div>
      </div>

      <>
        {selectedTopic?.description &&
          views &&
          views[1].value !== selectedView && (
            <MarkdownViewerUsingQuillOrNewEditor
              markdown={selectedTopic.description}
              className="subheader-text"
            />
          )}

        {isOnArchivePage && (
          <CWText className="subheader-text">
            This section is for all archived posts. Archived posts will always
            be visible here and can be linked to new thread posts, but they
            can’t be upvoted or receive new comments.
          </CWText>
        )}

        {app.chain?.meta && (
          // @ts-expect-error <StrictNullChecks/>
          <div className="filter-row" ref={filterRowRef}>
            <div className="filter-section">
              {!isWindowExtraSmall && <p className="filter-label">Sort</p>}
              <Select
                selected={featuredFilter || ThreadFeaturedFilterTypes.Newest}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              {!isWindowExtraSmall && <p className="filter-label">Filter</p>}
              <div className="filter-section filter-section-right">
                {((selectedView !== 'all' && topics) || []).length > 0 && (
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
                      ...(isContestAvailable
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
                      ...(isContestAvailable
                        ? [
                            { type: 'header-divider', label: 'Contests' },
                            ...contestNameOptions,
                          ]
                        : []),
                    ]}
                    dropdownPosition={rightFiltersDropdownPosition}
                    canEditOption={Permissions.isCommunityAdmin()}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onOptionEdit={(item: any) =>
                      setTopicSelectedToEdit(
                        [...featuredTopics, ...otherTopics].find(
                          (x) => x.id === item.id,
                        ),
                      )
                    }
                  />
                )}
                {!isWindowExtraSmall && matchesContestFilterRoute ? (
                  <Select
                    selected={urlParams.status || 'all'}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onSelect={(item: any) =>
                      onFilterSelect({
                        filterKey: 'status',
                        filterVal: item.value === 'all' ? '' : item.value,
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
                        value: 'pastWinners',
                      },
                      {
                        id: 2,
                        label: 'All Statuses',
                        value: 'all',
                      },
                    ]}
                    dropdownPosition={rightFiltersDropdownPosition}
                  />
                ) : (
                  stages_enabled &&
                  !isWindowExtraSmall &&
                  views &&
                  views[1].value !== selectedView && (
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
                              ? community?.numVotingThreads || 0
                              : ''
                          }`,
                        })),
                      ]}
                      dropdownPosition={rightFiltersDropdownPosition}
                    />
                  )
                )}
                {!isWindowExtraSmall && (
                  <Select
                    selected={dateRange || ThreadTimelineFilterTypes.AllTime}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                )}
              </div>
            </div>
          </div>
        )}
        {!isWindowExtraSmall && views && views[1].value !== selectedView && (
          <div className="checkboxes">
            <CWCheckbox
              checked={isIncludingSpamThreads}
              label="Include posts flagged as spam"
              onChange={(e) => {
                // @ts-expect-error <StrictNullChecks/>
                onIncludeSpamThreads(e.target.checked);
              }}
            />

            {!isOnArchivePage && (
              <CWCheckbox
                checked={isIncludingArchivedThreads}
                label="Include archived posts"
                onChange={(e) => {
                  // @ts-expect-error <StrictNullChecks/>
                  onIncludeArchivedThreads(e.target.checked);
                }}
              />
            )}
          </div>
        )}

        {(activeContests || []).map((contest) => {
          const { end_time } =
            // @ts-expect-error <StrictNullChecks/>
            contest?.contests[0] || {};

          return (
            <ContestCard
              key={contest.contest_address}
              isAdmin={false}
              // @ts-expect-error <StrictNullChecks/>
              address={contest.contest_address}
              // @ts-expect-error <StrictNullChecks/>
              name={contest.name}
              imageUrl={contest.image_url}
              // @ts-expect-error <StrictNullChecks/>
              topics={contest.topics}
              decimals={contest.decimals}
              ticker={contest.ticker}
              finishDate={end_time ? moment(end_time).toISOString() : ''}
              isCancelled={contest.cancelled}
              isRecurring={!contest.funding_token_address}
              isHorizontal
              showShareButton={false}
              payoutStructure={contest.payout_structure}
            />
          );
        })}
      </>

      <CWModal
        size="medium"
        content={
          topicSelectedToEdit ? (
            <EditTopicModal
              topic={topicSelectedToEdit}
              onModalClose={() => setTopicSelectedToEdit(undefined)}
            />
          ) : (
            <></>
          )
        }
        onClose={() => setTopicSelectedToEdit(undefined)}
        open={!!topicSelectedToEdit}
      />
    </div>
  );
};
