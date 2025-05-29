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
import useGetThreadsQuery from 'state/api/threads/getThreads';
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
  canUserPerformGatedAction,
  ContentType,
  formatDecimalToWei,
  GatedActionEnum,
  generateTopicIdentifiersFromUrl,
  generateUrlPartForTopicIdentifiers,
  sanitizeTopicName,
  ZERO_ADDRESS,
} from '@hicommonwealth/shared';
import Thread from 'client/scripts/models/Thread';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import { useFetchNodesQuery } from 'client/scripts/state/api/nodes';
import { useDateCursor } from 'client/scripts/state/api/threads/dateCursor';
import useUserStore from 'client/scripts/state/ui/user';
import { notifyError } from 'controllers/app/notifications';
import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import useTopicGating from 'hooks/useTopicGating';
import { ThreadKind } from 'models/types';
import type { DeltaStatic } from 'quill';
import { GridComponents, Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { prettyVoteWeight } from 'shared/adapters/currency';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useCreateThreadMutation, {
  buildCreateThreadInput,
} from 'state/api/threads/createThread';
import { useGetERC20BalanceQuery } from 'state/api/tokens';
import { saveToClipboard } from 'utils/clipboard';
import { StickyInput } from 'views/components/StickEditorContainer';
import { StickCommentProvider } from 'views/components/StickEditorContainer/context/StickCommentProvider';
// eslint-disable-next-line max-len
import { StickyCommentElementSelector } from 'views/components/StickEditorContainer/context/StickyCommentElementSelector';
import { WithDefaultStickyComment } from 'views/components/StickEditorContainer/context/WithDefaultStickyComment';
import TokenBanner from 'views/components/TokenBanner';
import { CWGatedTopicBanner } from 'views/components/component_kit/CWGatedTopicBanner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  createDeltaFromText,
  getTextFromDelta,
} from 'views/components/react_quill_editor';
import { serializeDelta } from 'views/components/react_quill_editor/utils';
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

export type ListContainerProps = React.HTMLProps<HTMLDivElement> & {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'overview', label: 'Overview' },
  { value: 'cardview', label: 'Cardview' },
];

const DiscussionsPage = () => {
  const [selectedView, setSelectedView] = useState<string>();
  const containerRef = useRef<HTMLDivElement>(null);

  const communityId = app.activeChainId() || '';
  const navigate = useCommonNavigate();
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [canShowGatingBanner, setCanShowGatingBanner] = useState(true);
  const [includeArchivedThreads, setIncludeArchivedThreads] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const stageName: string = searchParams.get('stage') || '';

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

  useLayoutEffect(() => {
    if (tabStatus === 'overview') {
      setSelectedView(VIEWS[1].value);
    } else if (tabStatus === 'cardview') {
      setSelectedView(VIEWS[2].value);
    } else {
      setSelectedView(VIEWS[0].value);
    }
  }, [tabStatus]);

  const topicIdentifiersFromURL = generateTopicIdentifiersFromUrl(
    window.location.href,
  );
  const topicObj = topics?.find(
    ({ name }) =>
      sanitizeTopicName(name) === topicIdentifiersFromURL?.topicName,
  );

  const { data: chainNodes } = useFetchNodesQuery();
  const topicId = topicObj?.id;
  const chainNode = chainNodes?.find(
    (node) => node.ethChainId === topicObj?.eth_chain_id,
  );

  const user = useUserStore();

  const { actionGroups, bypassGating } = useTopicGating({
    communityId: communityId,
    userAddress: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address && !!communityId,
    topicId,
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

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isLoading: isInitialLoading,
  } = useGetThreadsQuery({
    community_id: communityId,
    cursor: 1,
    limit: 20,
    topic_id: topicId,
    stage: stageName ?? undefined,
    ...(featuredFilter && {
      order_by: featuredFilter,
    }),
    ...(dateCursor.fromDate && {
      to_date: dateCursor.toDate,
      from_date: dateCursor.fromDate,
    }),
    archived: isOnArchivePage || includeArchivedThreads,
    contestAddress: contestAddress || undefined,
    enabled:
      !!communityId && (selectedView === 'all' || selectedView === 'cardview'),
  });
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);

  useEffect(() => {
    if (isInitialLoading || !data) return;
    const threads = sortPinned(
      sortByFeaturedFilter(
        data.pages.flatMap((p) => p.results.map((t) => new Thread(t))) || [],
        featuredFilter,
      ),
    );
    // Checks if the current page is a discussion page and if the window is small enough to render the mobile menu
    // Checks both for mobile device and inner window size for desktop responsiveness
    const filtered = threads.filter((t) => {
      if (!includeSpamThreads && t.markedAsSpamAt) return null;
      if (!isOnArchivePage && !includeArchivedThreads && t.archivedAt)
        return null;
      if (isOnArchivePage && !t.archivedAt) return null;
      return t;
    });
    setFilteredThreads(filtered);
  }, [
    data,
    featuredFilter,
    includeSpamThreads,
    includeArchivedThreads,
    isOnArchivePage,
    isInitialLoading,
  ]);

  //checks for malformed url in topics and redirects if the topic does not exist
  useEffect(() => {
    if (
      !isLoadingTopics &&
      topicIdentifiersFromURL &&
      topicIdentifiersFromURL.topicName !== 'archived' &&
      topicIdentifiersFromURL.topicName !== 'overview' &&
      tabStatus !== 'overview'
    ) {
      // Don't redirect if we're on a discussion page
      if (location.pathname.includes('/discussion/')) {
        return;
      }

      const validTopic = topics?.find(
        (topic) =>
          sanitizeTopicName(topic?.name) === topicIdentifiersFromURL.topicName,
      );
      if (!validTopic) {
        navigate('/discussions');
      }
      if (
        validTopic &&
        (!topicIdentifiersFromURL.topicId ||
          topicIdentifiersFromURL.topicId !== validTopic.id)
      ) {
        const identifier = generateUrlPartForTopicIdentifiers(
          validTopic?.id,
          validTopic.name,
        );
        navigate(`/discussions/${encodeURI(identifier)}`, { replace: true });
      }
    }
    if (topicIdentifiersFromURL?.topicName === 'overview') {
      setSelectedView(VIEWS[1].value);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, topicIdentifiersFromURL, isLoadingTopics]);

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
      ? prettyVoteWeight(
          formatDecimalToWei(voteBalance, topicObj!.token_decimals ?? 18),
          topicObj!.token_decimals,
          topicObj!.weighted_voting,
          topicObj!.vote_weight_multiplier || 1,
        )
      : '';

  const updateSelectedView = (activeTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    navigate(`${window.location.pathname}?${params.toString()}`, {}, null);
    setSelectedView(activeTab);
  };

  const [threadTitle, setThreadTitle] = useState<string>('');
  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>(
    createDeltaFromText(''),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId,
  });

  const handleCancel = () => {
    setThreadTitle('');
    setThreadContentDelta(createDeltaFromText(''));
  };

  const handleSubmitThread = async (): Promise<number> => {
    if (isSubmitting) return -1;

    let useTopicObj = topicObj;

    if (!useTopicObj && topics && topics.length > 0) {
      useTopicObj = topics.find((t) => t.name.toLowerCase() === 'general');

      if (!useTopicObj) {
        useTopicObj = topics[0];
      }
    }

    if (!useTopicObj) {
      notifyError('No topics available to create a thread');
      return -1;
    }

    if (!getTextFromDelta(threadContentDelta).trim()) {
      notifyError('Please enter content for your thread');
      return -1;
    }

    try {
      setIsSubmitting(true);

      const title =
        threadTitle || getTextFromDelta(threadContentDelta).substring(0, 60);

      const communityBase = app?.chain?.base || '';

      const threadInput = await buildCreateThreadInput({
        communityId,
        communityBase,
        address: user.activeAccount?.address || '',
        title: title,
        body: serializeDelta(threadContentDelta),
        kind: ThreadKind.Discussion,
        stage: '',
        topic: useTopicObj,
        url: '',
      });

      const newThread = await createThread(threadInput);

      setThreadTitle('');
      setThreadContentDelta(createDeltaFromText(''));

      navigate(`/discussion/${newThread.id}`);

      // Fix for TypeScript error - ensure we return a number
      return newThread.id ?? -1;
    } catch (err) {
      console.error('Error creating thread:', err);
      notifyError('Failed to create thread');
      return -1;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StickCommentProvider mode="thread">
      <CWPageLayout ref={containerRef} className="DiscussionsPageLayout">
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
            tokenAddress={topicObj?.token_address || ''}
            chainName={chainNode?.name}
            chainEthId={topicObj?.eth_chain_id || 0}
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

        {canShowGatingBanner && (
          <CWGatedTopicBanner
            actions={Object.values(GatedActionEnum)}
            actionGroups={actionGroups}
            bypassGating={bypassGating}
            onClose={() => setCanShowGatingBanner(false)}
          />
        )}

        <HeaderWithFilters
          topic={topicIdentifiersFromURL?.topicName || ''}
          stage={stageName}
          featuredFilter={featuredFilter}
          dateRange={dateRange}
          totalThreadCount={
            isOnArchivePage
              ? filteredThreads.length || 0
              : data?.pages[0]?.totalResults || 0
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
          <>
            <Virtuoso
              className="thread-list"
              style={{ height: '100%', width: '100%' }}
              data={isInitialLoading ? [] : filteredThreads}
              customScrollParent={containerRef.current || undefined}
              itemContent={(_, thread) => (
                <RenderThreadCard
                  thread={thread}
                  communityId={communityId}
                  actionGroups={actionGroups}
                  bypassGating={bypassGating}
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
          </>
        ) : selectedView === VIEWS[1].value ? (
          <OverviewPage
            topicId={topicId}
            featuredFilter={featuredFilter}
            timelineFilter={dateCursor}
          />
        ) : (
          <VirtuosoGrid
            data={isInitialLoading ? [] : filteredThreads}
            customScrollParent={containerRef.current || undefined}
            components={
              {
                List: (() => {
                  // eslint-disable-next-line react/no-multi-comp
                  const VirtuosoGridList = forwardRef<
                    HTMLDivElement,
                    ListContainerProps
                  >(({ children, ...props }, ref) => (
                    <div ref={ref} {...props}>
                      {children}
                    </div>
                  ));
                  VirtuosoGridList.displayName = 'VirtuosoGridList';
                  return VirtuosoGridList;
                })(),
                Item: (() => {
                  // eslint-disable-next-line react/no-multi-comp
                  const VirtuosoGridItem = ({
                    children,
                    ...props
                  }: {
                    children: React.ReactNode;
                  }) => <div {...props}>{children}</div>;
                  return VirtuosoGridItem;
                })(),
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
                actionGroups={actionGroups}
                bypassGating={bypassGating}
                contestsData={contestsData}
              />
            )}
            endReached={() => {
              hasNextPage && fetchNextPage();
            }}
            overscan={50}
          />
        )}

        <WithDefaultStickyComment>
          {user.isLoggedIn && user.activeAccount && (
            <StickyInput
              parentType={ContentType.Thread}
              canComment={canUserPerformGatedAction(
                actionGroups,
                GatedActionEnum.CREATE_COMMENT,
                bypassGating,
              )}
              handleSubmitComment={handleSubmitThread}
              errorMsg=""
              contentDelta={threadContentDelta}
              setContentDelta={setThreadContentDelta}
              disabled={isSubmitting}
              onCancel={handleCancel}
              author={user.activeAccount}
              editorValue={getTextFromDelta(threadContentDelta)}
              tooltipText=""
              topic={topicObj}
            />
          )}
        </WithDefaultStickyComment>

        <StickyCommentElementSelector />
      </CWPageLayout>
    </StickCommentProvider>
  );
};
export default DiscussionsPage;
