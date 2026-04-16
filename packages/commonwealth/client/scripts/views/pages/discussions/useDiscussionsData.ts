import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  canUserPerformGatedAction,
  formatDecimalToWei,
  GatedActionEnum,
  generateTopicIdentifiersFromUrl,
  generateUrlPartForTopicIdentifiers,
  sanitizeTopicName,
  ZERO_ADDRESS,
} from '@hicommonwealth/shared';
import Thread, { ThreadView } from 'client/scripts/models/Thread';
import type { Topic } from 'client/scripts/models/Topic';
import {
  ThreadFeaturedFilterTypes,
  ThreadKind,
  ThreadTimelineFilterTypes,
} from 'client/scripts/models/types';
import { notifyError } from 'controllers/app/notifications';
import useCommunityContests from 'features/contests/hooks/useCommunityContests';
import { isContestActive } from 'features/contests/utils/contestUtils';
import useTopicGating from 'hooks/useTopicGating';
import { useCommonNavigate } from 'navigation/helpers';
import type { DeltaStatic } from 'quill';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { prettyCompoundVoteWeight } from 'shared/adapters/currency';
import useManageDocumentTitle from 'shared/hooks/useManageDocumentTitle';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import { useFetchNodesQuery } from 'state/api/nodes';
import useCreateThreadMutation, {
  buildCreateThreadInput,
} from 'state/api/threads/createThread';
import { useDateCursor } from 'state/api/threads/dateCursor';
import useGetThreadsQuery from 'state/api/threads/getThreads';
import { useGetERC20BalanceQuery } from 'state/api/tokens';
import useTokenMetadataQuery from 'state/api/tokens/getTokenMetadata';
import { useFetchTopicsQuery } from 'state/api/topics';
import app from '../../../state';
import { useGetUserEthBalanceQuery } from '../../../state/api/communityStake';
import useUserStore from '../../../state/ui/user';
import {
  createDeltaFromText,
  getTextFromDelta,
} from '../../components/react_quill_editor';
import { serializeDelta } from '../../components/react_quill_editor/utils';
import {
  DISCUSSIONS_VIEWS,
  filterVisibleThreads,
  getDiscussionsTotalThreadCount,
  getTopicValidationNavigationDecision,
  resolveDiscussionsFeedVariant,
  resolveDiscussionsViewFromTab,
  shouldFetchDiscussionsThreads,
  shouldShowPrivateTopicBlock,
  type DiscussionsView,
} from './discussionsPage.contracts';
import { sortByFeaturedFilter, sortPinned } from './helpers';

type ExtendedTopic = Topic & {
  chain_node_url?: string | null;
  eth_chain_id?: number | null;
  secondary_tokens?: Array<{
    token_decimals?: number | null;
    token_symbol?: string | null;
    vote_weight_multiplier?: number | null;
  }> | null;
  token_address?: string | null;
  token_decimals?: number | null;
  token_symbol?: string | null;
  vote_weight_multiplier?: number | null;
  weighted_voting?: TopicWeightedVoting | null;
};

type ViewOption = {
  label: string;
  value: DiscussionsView;
};

export const DISCUSSIONS_VIEW_OPTIONS: ViewOption[] = [
  { value: 'all', label: 'All' },
  { value: 'overview', label: 'Overview' },
  { value: 'cardview', label: 'Cardview' },
];

export const useDiscussionsData = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [includeSpamThreads, setIncludeSpamThreads] = useState(false);
  const [canShowGatingBanner, setCanShowGatingBanner] = useState(true);
  const [includeArchivedThreads, setIncludeArchivedThreads] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContentDelta, setThreadContentDelta] = useState<DeltaStatic>(
    createDeltaFromText(''),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const communityId = app.activeChainId() || '';
  const user = useUserStore();

  const stageName = searchParams.get('stage') || '';
  const featuredFilter = searchParams.get(
    'featured',
  ) as ThreadFeaturedFilterTypes;
  const dateRange = searchParams.get('dateRange') as ThreadTimelineFilterTypes;
  const contestAddress = searchParams.get('contest');
  const tabStatus = searchParams.get('tab');

  const topicIdentifiersFromURL = useMemo(
    () =>
      generateTopicIdentifiersFromUrl(
        `${window.location.origin}${location.pathname}${location.search}`,
      ),
    [location.pathname, location.search],
  );

  const selectedView = useMemo<DiscussionsView>(() => {
    if (topicIdentifiersFromURL?.topicName === 'overview') {
      return DISCUSSIONS_VIEWS.OVERVIEW;
    }

    return resolveDiscussionsViewFromTab(tabStatus);
  }, [tabStatus, topicIdentifiersFromURL?.topicName]);

  const { data: topics, isLoading: isLoadingTopics } = useFetchTopicsQuery({
    communityId,
    apiEnabled: !!communityId,
  });

  const topicObj = topics?.find(
    ({ name }) =>
      sanitizeTopicName(name) === topicIdentifiersFromURL?.topicName,
  ) as ExtendedTopic | undefined;
  const topicId = topicObj?.id;

  const { data: chainNodes } = useFetchNodesQuery();
  const chainNode = chainNodes?.find(
    (node) => node.ethChainId === topicObj?.eth_chain_id,
  );

  const { bypassGating, actionGroups, isPrivateTopic, isAllowedMember } =
    useTopicGating({
      communityId,
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

  const { dateCursor } = useDateCursor({ dateRange });

  const isOnArchivePage =
    location.pathname ===
    (domain?.isCustomDomain ? '/archived' : `/${communityId}/archived`);

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
    enabled: !!communityId && shouldFetchDiscussionsThreads(selectedView),
  });

  const filteredThreads = useMemo(() => {
    if (isInitialLoading || !data) {
      return [];
    }

    const threads = sortPinned(
      sortByFeaturedFilter(
        data.pages.flatMap((page) =>
          page.results.map((thread) => new Thread(thread as ThreadView)),
        ),
        featuredFilter,
      ),
    );

    return filterVisibleThreads<Thread>({
      threads,
      includeSpamThreads,
      includeArchivedThreads,
      isOnArchivePage,
    });
  }, [
    data,
    featuredFilter,
    includeArchivedThreads,
    includeSpamThreads,
    isInitialLoading,
    isOnArchivePage,
  ]);

  useEffect(() => {
    const topicValidationDecision = getTopicValidationNavigationDecision({
      isLoadingTopics,
      topicIdentifiersFromURL,
      tabStatus,
      pathname: location.pathname,
      topics,
      sanitizeTopicName,
      generateUrlPartForTopicIdentifiers,
    });

    if (topicValidationDecision.type === 'navigate') {
      if (topicValidationDecision.replace) {
        navigate(topicValidationDecision.target, { replace: true });
      } else {
        navigate(topicValidationDecision.target);
      }
    }
  }, [
    isLoadingTopics,
    location.pathname,
    navigate,
    tabStatus,
    topicIdentifiersFromURL,
    topics,
  ]);

  useManageDocumentTitle('Discussions');

  const activeContestsInTopic = useMemo(
    () =>
      (contestsData.all || []).filter((contest) => {
        const isContestInTopic = (contest.topics || []).find(
          (topic) => topic.id === topicId,
        );
        return isContestInTopic && isContestActive({ contest });
      }),
    [contestsData.all, topicId],
  );

  const isTopicWeighted =
    !!topicId && topicObj?.weighted_voting === TopicWeightedVoting.ERC20;

  const voteBalance =
    topicObj?.token_address === ZERO_ADDRESS ? userEthBalance : erc20Balance;

  const voteWeight =
    isTopicWeighted && voteBalance
      ? prettyCompoundVoteWeight(
          [
            {
              wei: formatDecimalToWei(
                voteBalance,
                topicObj?.token_decimals ?? 18,
              ),
              tokenNumDecimals: topicObj?.token_decimals,
              multiplier: topicObj?.vote_weight_multiplier || 1,
              tokenSymbol: topicObj?.token_symbol || undefined,
            },
            ...((topicObj?.secondary_tokens || []).map((token) => ({
              wei: '0',
              tokenNumDecimals: token.token_decimals,
              multiplier: token.vote_weight_multiplier || undefined,
              tokenSymbol: token.token_symbol || undefined,
            })) || []),
          ],
          topicObj?.weighted_voting as TopicWeightedVoting,
        )
      : '';

  const tokenBanner = isTopicWeighted
    ? {
        avatarUrl: tokenMetadata?.logo,
        chainEthId: topicObj?.eth_chain_id || 0,
        chainName: chainNode?.name,
        name: tokenMetadata?.name,
        ticker: topicObj?.token_symbol,
        tokenAddress: topicObj?.token_address || '',
        voteWeight,
      }
    : null;

  const feedVariant = resolveDiscussionsFeedVariant(selectedView);

  const updateSelectedView = useCallback(
    (activeTab: string) => {
      const params = new URLSearchParams();
      params.set('tab', activeTab);
      navigate(`${location.pathname}?${params.toString()}`, {}, null);
    },
    [location.pathname, navigate],
  );

  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId,
  });

  const handleCancel = useCallback(() => {
    setThreadTitle('');
    setThreadContentDelta(createDeltaFromText(''));
  }, []);

  const handleSubmitThread = useCallback(
    async (turnstileToken?: string): Promise<number> => {
      if (isSubmitting) {
        return -1;
      }

      let useTopicObj = topicObj;

      if (!useTopicObj && topics && topics.length > 0) {
        useTopicObj = (topics.find(
          (topic) => topic.name.toLowerCase() === 'general',
        ) || topics[0]) as ExtendedTopic | undefined;
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
          title,
          body: serializeDelta(threadContentDelta),
          kind: ThreadKind.Discussion,
          stage: '',
          topic: useTopicObj,
          url: '',
          turnstileToken,
        });

        const newThread = await createThread(threadInput);

        setThreadTitle('');
        setThreadContentDelta(createDeltaFromText(''));

        navigate(`/discussion/${newThread.id}`);

        return newThread.id ?? -1;
      } catch (error) {
        console.error('Error creating thread:', error);
        notifyError((error as Error).message);
        return -1;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      communityId,
      createThread,
      isSubmitting,
      navigate,
      threadContentDelta,
      threadTitle,
      topicObj,
      topics,
      user.activeAccount?.address,
    ],
  );

  const totalThreadCount = getDiscussionsTotalThreadCount({
    filteredThreadsLength: filteredThreads.length,
    isOnArchivePage,
    totalResults: data?.pages[0]?.totalResults,
  });

  return {
    actionGroups,
    activeContestsInTopic,
    bypassGating,
    canCreateThread: canUserPerformGatedAction(
      actionGroups,
      GatedActionEnum.CREATE_COMMENT,
      bypassGating,
    ),
    canShowGatingBanner,
    communityId,
    containerRef,
    contestsData,
    dateCursor,
    dateRange,
    featuredFilter,
    feedVariant,
    fetchNextPage,
    filteredThreads,
    handleCancel,
    handleSubmitThread,
    hasNextPage,
    includeArchivedThreads,
    includeSpamThreads,
    isInitialLoading,
    isOnArchivePage,
    isPrivateTopicBlocked: shouldShowPrivateTopicBlock({
      isPrivateTopic,
      isAllowedMember,
      bypassGating,
    }),
    isSubmitting,
    selectedView,
    setCanShowGatingBanner,
    setIncludeArchivedThreads,
    setIncludeSpamThreads,
    setThreadContentDelta,
    stageName,
    threadContentDelta,
    tokenBanner,
    topicId,
    topicObj,
    topicSlug: topicIdentifiersFromURL?.topicName || '',
    totalThreadCount,
    updateSelectedView,
    user,
    views: DISCUSSIONS_VIEW_OPTIONS,
  };
};

export type UseDiscussionsDataReturn = ReturnType<typeof useDiscussionsData>;
