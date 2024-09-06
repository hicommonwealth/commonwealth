import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import useFetchThreadsQuery, {
  useDateCursor,
} from 'state/api/threads/fetchThreads';
import {
  ThreadFeaturedFilterTypes,
  ThreadTimelineFilterTypes,
} from '../../../models/types';
import app from '../../../state';
import { useFetchTopicsQuery } from '../../../state/api/topics';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { HeaderWithFilters } from './HeaderWithFilters';
import { ThreadCard } from './ThreadCard';
import { sortByFeaturedFilter, sortPinned } from './helpers';

import { slugify, splitAndDecodeURL } from '@hicommonwealth/shared';
import { getThreadActionTooltipText } from 'helpers/threads';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import 'pages/discussions/index.scss';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import { useRefreshMembershipQuery } from 'state/api/groups';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { checkIsTopicInContest } from 'views/components/NewThreadForm/helpers';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { isContestActive } from 'views/pages/CommunityManagement/Contests/utils';
import { AdminOnboardingSlider } from '../../components/AdminOnboardingSlider';
import { UserTrainingSlider } from '../../components/UserTrainingSlider';
import { DiscussionsFeedDiscovery } from './DiscussionsFeedDiscovery';
import { EmptyThreadsPlaceholder } from './EmptyThreadsPlaceholder';

type DiscussionsPageProps = {
  topicName?: string;
};

const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const communityId = app.activeChainId();
  const navigate = useCommonNavigate();
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [includeArchivedThreads, setIncludeArchivedThreads] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();
  // @ts-expect-error <StrictNullChecks/>
  const stageName: string = searchParams.get('stage');

  const featuredFilter: ThreadFeaturedFilterTypes = searchParams.get(
    'featured',
  ) as ThreadFeaturedFilterTypes;

  const dateRange: ThreadTimelineFilterTypes = searchParams.get(
    'dateRange',
  ) as ThreadTimelineFilterTypes;

  const { data: topics, isLoading: isLoadingTopics } = useFetchTopicsQuery({
    communityId,
  });
  const contestAddress = searchParams.get('contest');
  const contestStatus = searchParams.get('status');

  const containerRef = useRef();

  useBrowserWindow({});

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const topicId = (topics || []).find(({ name }) => name === topicName)?.id;

  const user = useUserStore();

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: communityId,
    address: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address,
  });

  const { data: domain } = useFetchCustomDomainQuery();

  const { contestsData } = useCommunityContests();

  const { dateCursor } = useDateCursor({
    dateRange: searchParams.get('dateRange') as ThreadTimelineFilterTypes,
  });

  const isOnArchivePage =
    location.pathname ===
    (domain?.isCustomDomain ? `/archived` : `/${app.activeChainId()}/archived`);

  const { fetchNextPage, data, isInitialLoading, hasNextPage } =
    useFetchThreadsQuery({
      communityId: app.activeChainId(),
      queryType: 'bulk',
      page: 1,
      limit: 20,
      topicId,
      stage: stageName ?? undefined,
      includePinnedThreads: true,
      ...(featuredFilter && {
        orderBy: featuredFilter,
      }),
      toDate: dateCursor.toDate,
      // @ts-expect-error <StrictNullChecks/>
      fromDate: dateCursor.fromDate,
      includeArchivedThreads: isOnArchivePage || includeArchivedThreads,
      // @ts-expect-error <StrictNullChecks/>
      contestAddress,
      // @ts-expect-error <StrictNullChecks/>
      contestStatus,
    });

  const threads = sortPinned(sortByFeaturedFilter(data || [], featuredFilter));

  // Checks if the current page is a discussion page and if the window is small enough to render the mobile menu
  // Checks both for mobile device and inner window size for desktop responsiveness
  const filteredThreads = threads.filter((t) => {
    if (!includeSpamThreads && t.markedAsSpamAt) return null;

    if (!isOnArchivePage && !includeArchivedThreads && t.archivedAt)
      return null;

    if (isOnArchivePage && !t.archivedAt) return null;

    return t;
  });

  //splitAndDecodeURL checks if a url is custom or not and decodes the url after splitting it
  const topicNameFromURL = splitAndDecodeURL(location.pathname);

  //checks for malformed url in topics and redirects if the topic does not exist
  useEffect(() => {
    if (
      !isLoadingTopics &&
      topicNameFromURL &&
      topicNameFromURL !== 'archived'
    ) {
      const validTopics = topics?.some(
        (topic) => topic?.name === topicNameFromURL,
      );
      if (!validTopics) {
        navigate('/discussions');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, topicNameFromURL, isLoadingTopics]);

  useManageDocumentTitle('Discussions');

  const activeContestsInTopic = contestsData?.filter((contest) => {
    const isContestInTopic = (contest.topics || []).find(
      (topic) => topic.id === topicId,
    );
    const isActive = isContestActive({ contest });
    return isContestInTopic && isActive;
  });

  return (
    // @ts-expect-error <StrictNullChecks/>
    <CWPageLayout ref={containerRef} className="DiscussionsPageLayout">
      <DiscussionsFeedDiscovery
        orderBy={featuredFilter}
        community={communityId}
        includePinnedThreads={true}
      />
      <Virtuoso
        className="thread-list"
        style={{ height: '100%', width: '100%' }}
        data={isInitialLoading ? [] : filteredThreads}
        customScrollParent={containerRef.current}
        itemContent={(i, thread) => {
          const discussionLink = getProposalUrlPath(
            thread.slug,
            `${thread.identifier}-${slugify(thread.title)}`,
          );

          const isTopicGated = !!(memberships || []).find((membership) =>
            membership.topicIds.includes(thread?.topic?.id),
          );

          const isActionAllowedInGatedTopic = !!(memberships || []).find(
            (membership) =>
              membership.topicIds.includes(thread?.topic?.id) &&
              membership.isAllowed,
          );

          const isRestrictedMembership =
            !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

          const disabledActionsTooltipText = getThreadActionTooltipText({
            isCommunityMember: !!user.activeAccount,
            isThreadArchived: !!thread?.archivedAt,
            isThreadLocked: !!thread?.lockedAt,
            isThreadTopicGated: isRestrictedMembership,
          });

          const isThreadTopicInContest = checkIsTopicInContest(
            contestsData,
            thread?.topic?.id,
          );

          return (
            <ThreadCard
              key={thread?.id + '-' + thread.readOnly}
              thread={thread}
              canReact={!disabledActionsTooltipText}
              canComment={!disabledActionsTooltipText}
              onEditStart={() => navigate(`${discussionLink}`)}
              onStageTagClick={() => {
                navigate(`/discussions?stage=${thread.stage}`);
              }}
              threadHref={`${getScopePrefix()}${discussionLink}`}
              onBodyClick={() => {
                const scrollEle = document.getElementsByClassName('Body')[0];

                localStorage[`${communityId}-discussions-scrollY`] =
                  scrollEle.scrollTop;
              }}
              onCommentBtnClick={() =>
                navigate(`${discussionLink}?focusComments=true`)
              }
              disabledActionsTooltipText={disabledActionsTooltipText}
              hideRecentComments
              editingDisabled={isThreadTopicInContest}
            />
          );
        }}
        endReached={() => {
          hasNextPage && fetchNextPage();
        }}
        overscan={50}
        components={{
          // eslint-disable-next-line react/no-multi-comp
          EmptyPlaceholder: () => (
            <EmptyThreadsPlaceholder
              isInitialLoading={isInitialLoading}
              isOnArchivePage={isOnArchivePage}
            />
          ),
          // eslint-disable-next-line react/no-multi-comp
          Header: () => (
            <>
              <Breadcrumbs />
              <UserTrainingSlider />
              <AdminOnboardingSlider />

              <HeaderWithFilters
                // @ts-expect-error <StrictNullChecks/>
                topic={topicName}
                stage={stageName}
                featuredFilter={featuredFilter}
                dateRange={dateRange}
                totalThreadCount={
                  isOnArchivePage
                    ? filteredThreads.length || 0
                    : threads
                      ? app?.chain?.meta?.lifetimeThreadCount
                      : 0
                }
                isIncludingSpamThreads={includeSpamThreads}
                onIncludeSpamThreads={setIncludeSpamThreads}
                isIncludingArchivedThreads={includeArchivedThreads}
                onIncludeArchivedThreads={setIncludeArchivedThreads}
                isOnArchivePage={isOnArchivePage}
                activeContests={activeContestsInTopic}
              />
            </>
          ),
        }}
      />
    </CWPageLayout>
  );
};

export default DiscussionsPage;
