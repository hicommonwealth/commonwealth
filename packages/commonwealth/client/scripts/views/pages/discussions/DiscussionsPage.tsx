import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { useCommonNavigate } from 'navigation/helpers';
import React, {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { sortByFeaturedFilter, sortPinned } from './helpers';

import {
  ZERO_ADDRESS,
  formatDecimalToWei,
  splitAndDecodeURL,
} from '@hicommonwealth/shared';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import useUserStore from 'client/scripts/state/ui/user';
import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import useTopicGating from 'hooks/useTopicGating';
import { GridComponents, Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { prettyVoteWeight } from 'shared/adapters/currency';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import { useGetERC20BalanceQuery } from 'state/api/tokens';
import { saveToClipboard } from 'utils/clipboard';
import TokenBanner from 'views/components/TokenBanner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { isContestActive } from 'views/pages/CommunityManagement/Contests/utils';
import useTokenMetadataQuery from '../../../state/api/tokens/getTokenMetadata';
import { AdminOnboardingSlider } from '../../components/AdminOnboardingSlider';
import { UserTrainingSlider } from '../../components/UserTrainingSlider';
import { CWText } from '../../components/component_kit/cw_text';
import CWIconButton from '../../components/component_kit/new_designs/CWIconButton';
import OverviewPage from '../overview';
import { DiscussionsFeedDiscovery } from './DiscussionsFeedDiscovery';
import './DiscussionsPage.scss';
import { EmptyThreadsPlaceholder } from './EmptyThreadsPlaceholder';
import { RenderThreadCard } from './RenderThreadCard';
type DiscussionsPageProps = {
  tabs?: { value: string; label: string };
  selectedView?: string;
  topicName?: string;
  updateSelectedView?: (tabValue: string) => void;
};
export type ListContainerProps = React.HTMLProps<HTMLDivElement> & {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'overview', label: 'Overview' },
  { value: 'cardview', label: 'Cardview' },
];
const DiscussionsPage = ({ topicName }: DiscussionsPageProps) => {
  const [selectedView, setSelectedView] = useState<string>();

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

  const { data: topics, isLoading: isLoadingTopics } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });
  const contestAddress = searchParams.get('contest');
  const contestStatus = searchParams.get('status');
  const tabStatus = searchParams.get('tab');

  const containerRef = useRef();
  useLayoutEffect(() => {
    if (tabStatus === 'overview') {
      setSelectedView(VIEWS[1].value);
    } else if (tabStatus === 'cardview') {
      setSelectedView(VIEWS[2].value);
    } else {
      setSelectedView(VIEWS[0].value);
    }
  }, [tabStatus]);

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
    nodeRpc: topicObj?.chain_node_url || app?.chain.meta?.ChainNode?.url || '',
    enabled: topicObj?.token_address !== ZERO_ADDRESS,
  });

  const { data: userEthBalance } = useGetUserEthBalanceQuery({
    chainRpc: topicObj?.chain_node_url || '',
    walletAddress: user.activeAccount?.address || '',
    ethChainId: topicObj?.eth_chain_id || 0,
    apiEnabled: topicObj?.token_address === ZERO_ADDRESS,
  });

  const { dateCursor } = useDateCursor({
    dateRange: searchParams.get('dateRange') as ThreadTimelineFilterTypes,
  });

  const isOnArchivePage =
    location.pathname ===
    (domain?.isCustomDomain ? `/archived` : `/${app.activeChainId()}/archived`);

  const { data: tokenMetadata } = useTokenMetadataQuery({
    tokenId: topicObj?.token_address || '',
    nodeEthChainId:
      topicObj?.eth_chain_id || app?.chain.meta?.ChainNode?.eth_chain_id || 0,
  });

  const { fetchNextPage, data, isInitialLoading, hasNextPage, threadCount } =
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
      apiEnabled:
        !!communityId &&
        (selectedView === 'all' || selectedView === 'cardview'),
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
      }
    }
    if (topicNameFromURL === 'overview') {
      setSelectedView(VIEWS[1].value);
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

  const voteBalance =
    topicObj?.token_address === ZERO_ADDRESS ? userEthBalance : erc20Balance;

  const voteWeight =
    isTopicWeighted && voteBalance
      ? prettyVoteWeight(formatDecimalToWei(voteBalance, 1))
      : '';

  const updateSelectedView = (activeTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    navigate(`${window.location.pathname}?${params.toString()}`, {}, null);
    setSelectedView(activeTab);
  };

  return (
    <>
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
                ? threadCount || 0
                : 0
          }
          isIncludingSpamThreads={includeSpamThreads}
          onIncludeSpamThreads={setIncludeSpamThreads}
          isIncludingArchivedThreads={includeArchivedThreads}
          onIncludeArchivedThreads={setIncludeArchivedThreads}
          isOnArchivePage={isOnArchivePage}
          activeContests={activeContestsInTopic}
          views={VIEWS}
          selectedView={selectedView}
          setSelectedView={updateSelectedView}
        />
        {selectedView === VIEWS[0].value ? (
          <Virtuoso
            className="thread-list"
            style={{ height: '100%', width: '100%' }}
            data={isInitialLoading ? [] : filteredThreads}
            customScrollParent={containerRef.current}
            itemContent={(_, thread) => (
              <RenderThreadCard
                thread={thread}
                communityId={communityId}
                memberships={memberships}
                topicPermissions={topicPermissions}
                contestsData={contestsData}
              />
            )}
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
        ) : selectedView === VIEWS[1].value ? (
          <OverviewPage />
        ) : (
          <VirtuosoGrid
            data={isInitialLoading ? [] : filteredThreads}
            customScrollParent={containerRef.current}
            components={
              {
                // eslint-disable-next-line  react/display-name,, react/no-multi-comp
                List: forwardRef<HTMLDivElement, ListContainerProps>(
                  ({ children, ...props }, ref) => (
                    <div ref={ref} {...props}>
                      {children}
                    </div>
                  ),
                ),
                // eslint-disable-next-line , react/prop-types, react/no-multi-comp
                Item: ({ children, ...props }) => (
                  <div {...props}>{children}</div>
                ),
              } as GridComponents
            }
            itemContent={(_, thread) => (
              <RenderThreadCard
                thread={thread}
                hideThreadOptions={true}
                isCardView={true}
                hidePublishDate={true}
                hideTrendingTag={true}
                hideSpamTag={true}
                communityId={communityId}
                memberships={memberships}
                topicPermissions={topicPermissions}
                contestsData={contestsData}
              />
            )}
            endReached={() => {
              hasNextPage && fetchNextPage();
            }}
            overscan={50}
          />
        )}
      </CWPageLayout>
    </>
  );
};
export default DiscussionsPage;
