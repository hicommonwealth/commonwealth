import { PermissionEnum, TopicWeightedVoting } from '@hicommonwealth/schemas';
import { getProposalUrlPath } from 'identifiers';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import useUserStore from 'client/scripts/state/ui/user';
import { getThreadActionTooltipText } from 'helpers/threads';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import useTopicGating from 'hooks/useTopicGating';
import 'pages/discussions/index.scss';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import { useGetERC20BalanceQuery } from 'state/api/tokens';
import Permissions from 'utils/Permissions';
import { saveToClipboard } from 'utils/clipboard';
import { checkIsTopicInContest } from 'views/components/NewThreadFormLegacy/helpers';
import TokenBanner from 'views/components/TokenBanner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { isContestActive } from 'views/pages/CommunityManagement/Contests/utils';
import useTokenMetadataQuery from '../../../state/api/tokens/getTokenMetadata';
import { SublayoutBanners } from '../../SublayoutBanners';
import { AdminOnboardingSlider } from '../../components/AdminOnboardingSlider';
import { UserTrainingSlider } from '../../components/UserTrainingSlider';
import { CWText } from '../../components/component_kit/cw_text';
import CWIconButton from '../../components/component_kit/new_designs/CWIconButton';
import OverviewPage from '../overview';
import { DiscussionsFeedDiscovery } from './DiscussionsFeedDiscovery';
import { EmptyThreadsPlaceholder } from './EmptyThreadsPlaceholder';

type DiscussionsPageProps = {
  tabs?: { value: string; label: string };
  selectedTab?: string;
  topicName?: string;
  updateActiveTab?: (tabValue: string) => void;
};
const TABS = [
  { value: 'all', label: 'ALL' },
  { value: 'overview', label: 'Overview' },
];
const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const [selectedTab, setSelectedTab] = useState(TABS[0].value);
  const [showTab, setShowTab] = useState(true);

  const communityId = app.activeChainId() || '';
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

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
    includeNodeInfo: true,
  });

  const { data: topics, isLoading: isLoadingTopics } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });
  const contestAddress = searchParams.get('contest');
  const contestStatus = searchParams.get('status');
  const tabStatus = searchParams.get('tab');

  const containerRef = useRef();
  useLayoutEffect(() => {
    if (tabStatus) {
      setSelectedTab(TABS[1].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBrowserWindow({});

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const topicObj = topics?.find(({ name }) => name === topicName);
  const topicId = topicObj?.id;

  const user = useUserStore();

  const { memberships, topicPermissions } = useTopicGating({
    communityId: communityId,
    userAddress: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address && !!communityId,
  });

  const { data: domain } = useFetchCustomDomainQuery();

  const { contestsData } = useCommunityContests();

  const { data: erc20Balance } = useGetERC20BalanceQuery({
    tokenAddress: topicObj?.token_address || '',
    userAddress: user.activeAccount?.address || '',
    nodeRpc: app?.chain.meta?.ChainNode?.url || '',
  });

  const { dateCursor } = useDateCursor({
    dateRange: searchParams.get('dateRange') as ThreadTimelineFilterTypes,
  });

  const isOnArchivePage =
    location.pathname ===
    (domain?.isCustomDomain ? `/archived` : `/${app.activeChainId()}/archived`);

  const { data: tokenMetadata } = useTokenMetadataQuery({
    tokenId: topicObj?.token_address || '',
    nodeEthChainId: app?.chain.meta?.ChainNode?.eth_chain_id || 0,
  });

  const { fetchNextPage, data, isInitialLoading, hasNextPage } =
    useFetchThreadsQuery({
      communityId: communityId,
      queryType: 'bulk',
      page: 1,
      limit: 20,
      topicId,
      stage: stageName ?? undefined,
      includePinnedThreads: true,
      ...(featuredFilter && {
        orderBy: featuredFilter,
      }),
      ...(dateCursor.fromDate && {
        toDate: dateCursor.toDate,
        fromDate: dateCursor.fromDate,
      }),
      includeArchivedThreads: isOnArchivePage || includeArchivedThreads,
      // @ts-expect-error <StrictNullChecks/>
      contestAddress,
      // @ts-expect-error <StrictNullChecks/>
      contestStatus,
      apiEnabled: !!communityId,
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
      topicNameFromURL !== 'archived' &&
      topicNameFromURL !== 'overview' &&
      tabStatus !== 'overview'
    ) {
      const validTopics = topics?.some(
        (topic) => topic?.name === topicNameFromURL,
      );
      if (!validTopics) {
        navigate('/discussions');
      } else if (validTopics) {
        setShowTab(false);
      }
    }
    if (topicNameFromURL === 'archived') {
      setShowTab(false);
    }
    if (topicNameFromURL === 'overview') {
      setSelectedTab(TABS[1].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, topicNameFromURL, isLoadingTopics]);

  useManageDocumentTitle('Discussions');

  const isTopicWeighted =
    topicId && topicObj.weighted_voting === TopicWeightedVoting.ERC20;

  const activeContestsInTopic = contestsData.all?.filter((contest) => {
    const isContestInTopic = (contest.topics || []).find(
      (topic) => topic.id === topicId,
    );
    const isActive = isContestActive({ contest });
    return isContestInTopic && isActive;
  });

  const voteWeight =
    isTopicWeighted && erc20Balance
      ? String(
          (
            (topicObj?.vote_weight_multiplier || 1) * Number(erc20Balance)
          ).toFixed(0),
        )
      : '';
  const updateActiveTab = (activeTab: string) => {
    setSelectedTab(activeTab);
  };

  return (
    <>
      <SublayoutBanners banner="“Overview” page has been merged with the “All” page" />
      <CWPageLayout
        // @ts-expect-error <StrictNullChecks/>
        ref={containerRef}
        className="DiscussionsPageLayout"
      >
        <DiscussionsFeedDiscovery
          orderBy={featuredFilter}
          community={communityId}
          includePinnedThreads={true}
        />
        {/* Updated Header Content Outside Virsoto */}

        <Breadcrumbs />
        <UserTrainingSlider />
        <AdminOnboardingSlider />
        {isTopicWeighted && (
          <TokenBanner
            name={tokenMetadata?.name}
            ticker={topicObj?.token_symbol}
            avatarUrl={tokenMetadata?.logo}
            voteWeight={voteWeight}
            popover={{
              title: tokenMetadata?.name,
              body: (
                <>
                  <CWText type="b2" className="token-description">
                    This topic has weighted voting enabled using{' '}
                    <span className="token-address">
                      {topicObj.token_address}
                    </span>
                    <CWIconButton
                      iconName="copy"
                      onClick={() => {
                        saveToClipboard(topicObj.token_address!, true).catch(
                          console.error,
                        );
                      }}
                    />
                  </CWText>
                </>
              ),
            }}
          />
        )}
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
                ? community?.lifetime_thread_count || 0
                : 0
          }
          isIncludingSpamThreads={includeSpamThreads}
          onIncludeSpamThreads={setIncludeSpamThreads}
          isIncludingArchivedThreads={includeArchivedThreads}
          onIncludeArchivedThreads={setIncludeArchivedThreads}
          isOnArchivePage={isOnArchivePage}
          activeContests={activeContestsInTopic}
          tabs={TABS}
          selectedTab={selectedTab}
          updateActiveTab={updateActiveTab}
          showTabs={showTab}
        />

        {selectedTab === TABS[0].value ? (
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

              const isTopicGated = !!(memberships || []).find(
                (membership) =>
                  thread?.topic?.id &&
                  membership.topics.find((t) => t.id === thread.topic!.id),
              );
              const isActionAllowedInGatedTopic = !!(memberships || []).find(
                (membership) =>
                  thread?.topic?.id &&
                  membership.topics.find((t) => t.id === thread.topic!.id) &&
                  membership.isAllowed,
              );
              const isRestrictedMembership =
                !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;
              const foundTopicPermissions = topicPermissions.find(
                (tp) => tp.id === thread.topic!.id,
              );
              const disabledActionsTooltipText = getThreadActionTooltipText({
                isCommunityMember: !!user.activeAccount,
                isThreadArchived: !!thread?.archivedAt,
                isThreadLocked: !!thread?.lockedAt,
                isThreadTopicGated: isRestrictedMembership,
              });
              const disabledReactPermissionTooltipText =
                getThreadActionTooltipText({
                  isCommunityMember: !!user.activeAccount,
                  threadTopicInteractionRestrictions:
                    !isAdmin &&
                    !foundTopicPermissions?.permissions?.includes(
                      // this should be updated if we start displaying recent comments on this page
                      PermissionEnum.CREATE_THREAD_REACTION,
                    )
                      ? foundTopicPermissions?.permissions
                      : undefined,
                });
              const disabledCommentPermissionTooltipText =
                getThreadActionTooltipText({
                  isCommunityMember: !!user.activeAccount,
                  threadTopicInteractionRestrictions:
                    !isAdmin &&
                    !foundTopicPermissions?.permissions?.includes(
                      PermissionEnum.CREATE_COMMENT,
                    )
                      ? foundTopicPermissions?.permissions
                      : undefined,
                });
              const isThreadTopicInContest = checkIsTopicInContest(
                contestsData.all,
                thread?.topic?.id,
              );

              return (
                <ThreadCard
                  key={thread?.id + '-' + thread.readOnly}
                  thread={thread}
                  canReact={
                    disabledReactPermissionTooltipText
                      ? !disabledReactPermissionTooltipText
                      : !disabledActionsTooltipText
                  }
                  canComment={
                    disabledCommentPermissionTooltipText
                      ? !disabledCommentPermissionTooltipText
                      : !disabledActionsTooltipText
                  }
                  onEditStart={() => navigate(`${discussionLink}?isEdit=true`)}
                  onStageTagClick={() => {
                    navigate(`/discussions?stage=${thread.stage}`);
                  }}
                  threadHref={`${getScopePrefix()}${discussionLink}`}
                  onBodyClick={() => {
                    const scrollEle =
                      document.getElementsByClassName('Body')[0];
                    localStorage[`${communityId}-discussions-scrollY`] =
                      scrollEle.scrollTop;
                  }}
                  onCommentBtnClick={() =>
                    navigate(`${discussionLink}?focusComments=true`)
                  }
                  disabledActionsTooltipText={
                    disabledCommentPermissionTooltipText ||
                    disabledReactPermissionTooltipText ||
                    disabledActionsTooltipText
                  }
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
            }}
          />
        ) : (
          <OverviewPage />
        )}
      </CWPageLayout>
    </>
  );
};
export default DiscussionsPage;
