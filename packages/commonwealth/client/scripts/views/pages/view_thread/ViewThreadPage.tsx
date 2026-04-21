import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import {
  ContentType,
  DEFAULT_COMPLETION_MODEL,
  DEFAULT_COMPLETION_MODEL_LABEL,
  GatedActionEnum,
  getThreadUrl,
  MIN_CHARS_TO_SHOW_MORE,
} from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import useForceRerender from 'client/scripts/hooks/useForceRerender';
import { useInitChainIfNeeded } from 'client/scripts/hooks/useInitChainIfNeeded';
import { AnyProposal } from 'client/scripts/models/types';
import useGetThreadByIdQuery from 'client/scripts/state/api/threads/getThreadById';
import useGetThreadToken from 'client/scripts/state/api/tokens/getThreadToken';
import { notifyError } from 'controllers/app/notifications';
import { isDefaultStage } from 'helpers';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useTopicGating from 'hooks/useTopicGating';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { useBrowserAnalyticsTrack } from 'shared/hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'shared/hooks/useBrowserWindow';
import useRunOnceOnCondition from 'shared/hooks/useRunOnceOnCondition';
import app from 'state';
import useGetContentByUrlQuery from 'state/api/general/getContentByUrl';
import { useGetPredictionMarketsQuery } from 'state/api/predictionMarket';
import {
  useAddThreadLinksMutation,
  useGetThreadPollsQuery,
  useGetThreadsByIdQuery,
} from 'state/api/threads';
import useUserStore, {
  useAIFeatureEnabled,
  useUserAiSettingsStore,
} from 'state/ui/user';
import MarkdownViewerWithFallback from 'views/components/MarkdownViewerWithFallback';
import { checkIsTopicInContest } from 'views/components/NewThreadForm/helpers';
import { StickyCommentElementSelector } from 'views/components/StickEditorContainer/context';
import { StickCommentProvider } from 'views/components/StickEditorContainer/context/StickCommentProvider';
import { WithDefaultStickyComment } from 'views/components/StickEditorContainer/context/WithDefaultStickyComment';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import { Link, LinkSource } from '../../../models/Thread';
import Permissions from '../../../utils/Permissions';
import { CreateComment } from '../../components/Comments/CreateComment';
import MetaTags from '../../components/MetaTags';
import { ThreadTokenDrawer } from '../../components/ThreadTokenDrawer';
import { ViewThreadUpvotesDrawer } from '../../components/UpvoteDrawer';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import { CWAvatar } from '../../components/component_kit/cw_avatar';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import DetailCard from '../../components/proposals/DetailCard';
import TimeLineCard from '../../components/proposals/TimeLineCard';
import VotingResultView from '../../components/proposals/VotingResultView';
import { VotingResults } from '../../components/proposals/voting_results';
import { getTextFromDelta } from '../../components/react_quill_editor/';
import { useCosmosProposal } from '../NewProposalViewPage/useCosmosProposal';
import { useSnapshotProposal } from '../NewProposalViewPage/useSnapshotProposal';
import { CommentTree } from '../discussions/CommentTree';
import { StreamingReplyInstance } from '../discussions/CommentTree/TreeHierarchy';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import { formatVersionText } from '../discussions/ThreadCard/AuthorAndPublishInfo/utils';
import { PollCard } from './PollCard';
import { PredictionMarketCard } from './PredictionMarketCard';
import { PrimaryInteractions } from './PrimaryInteractions';
import { ReferencesCard } from './ReferencesCard';
import { SnapshotCard } from './SnapshotCard';
import {
  ThreadAuthorProfileSheet,
  useThreadAuthorProfileDesktopHover,
} from './ThreadAuthorProfileSheet';
import { ThreadTokenCard } from './ThreadTokenCard';
import { EditBody } from './edit_body';
import './index.scss';
import {
  estimateReadingTimeMinutes,
  formatCompactSocialCount,
} from './threadMetaHelpers';
import {
  resolveViewThreadRenderState,
  shouldShowCreateCommentComposer,
} from './viewThreadPage.contracts';

export const THREAD_VIEW_TAB_NAMES = [
  'Discussion',
  'References',
  'Poll',
  'Snapshot',
  'Prediction Market',
  'Thread Token',
] as const;

export type ThreadViewTabName = (typeof THREAD_VIEW_TAB_NAMES)[number];
const CURRENT_THREAD_VERSION_ID = -1;

type ViewThreadPageProps = {
  identifier: string;
};

const ViewThreadPage = ({ identifier }: ViewThreadPageProps) => {
  const threadId = parseInt(`${identifier.split('-')?.[0] || 0}`);
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('isEdit') ?? undefined;
  const navigate = useCommonNavigate();
  const tokenizedThreadsEnabled = useFlag('tokenizedThreads');
  const futarchyEnabled = useFlag('futarchy');
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isGloballyEditing, setIsGloballyEditing] = useState(false);
  const [savedEdits, setSavedEdits] = useState('');
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);
  const [showVotesDrawer, setShowVotesDrawer] = useState(false);
  const { isWindowSmallInclusive, isWindowExtraSmall } = useBrowserWindow({});
  const [hideGatingBanner, setHideGatingBanner] = useState(false);
  const initalAiCommentPosted = useRef(false);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [proposalRedrawState, redrawProposals] = useState<boolean>(true);
  const [imageActionModalOpen, setImageActionModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState(false);
  const [isTokenDrawerOpen, setIsTokenDrawerOpen] = useState(false);
  const [isAuthorProfileSheetOpen, setIsAuthorProfileSheetOpen] =
    useState(false);
  const [activeThreadViewTab, setActiveThreadViewTab] =
    useState<ThreadViewTabName>('Discussion');
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  useInitChainIfNeeded(app);
  const user = useUserStore();
  const commentsRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const authorAvatarButtonRef = useRef<HTMLButtonElement>(null);
  const forceRerender = useForceRerender();

  const { isAddedToHomeScreen } = useAppStatus();

  const communityId = app.activeChainId() || '';

  const {
    data: threadView,
    error: fetchThreadError,
    isLoading,
    refetch: refetchThread,
  } = useGetThreadByIdQuery(
    threadId,
    !!threadId && !!communityId, // only call the api if we have thread id
  );

  const { data: pollsData = [] } = useGetThreadPollsQuery({
    threadId: +threadId,
    apiCallEnabled: !!threadId && !!communityId,
  });
  const { data: threadsByIdData = [] } = useGetThreadsByIdQuery({
    community_id: communityId,
    thread_ids: threadId ? [threadId] : [],
    apiCallEnabled: !!threadId && !!communityId,
  });

  const { data: predictionMarketsData } = useGetPredictionMarketsQuery({
    thread_id: threadId,
    limit: 1,
    apiCallEnabled: futarchyEnabled && !!threadId && !!communityId,
  });

  const { data: threadToken } = useGetThreadToken({
    thread_id: threadId,
    enabled: !!threadId && !!communityId,
  });

  const thread = useMemo(() => {
    return threadView;
  }, [threadView]);
  const fullVersionHistory = useMemo(() => {
    const fromGetThreadsById = threadsByIdData.find((t) => t.id === thread?.id);
    return fromGetThreadsById?.versionHistory ?? thread?.versionHistory ?? [];
  }, [threadsByIdData, thread?.id, thread?.versionHistory]);

  const { avatarHoverProps, popoverHoverProps } =
    useThreadAuthorProfileDesktopHover({
      enabled:
        !isWindowExtraSmall &&
        !!thread?.profile?.userId &&
        !!thread?.profile?.avatarUrl,
      onRequestOpen: () => setIsAuthorProfileSheetOpen(true),
      onRequestClose: () => setIsAuthorProfileSheetOpen(false),
    });

  //  snapshot proposal hook
  const snapshotLink = thread?.links?.find(
    (link) => link?.source === 'snapshot',
  );
  const proposalLink = thread?.links?.find(
    (link) => link?.source === LinkSource.Proposal,
  );

  const [snapshotId, proposalId] = snapshotLink?.identifier?.split('/') || [
    '',
    '',
  ];

  const {
    proposal: snapshotProposal,
    symbol,
    votes,
    space,
    totals,
    totalScore,
    validatedAgainstStrategies,
    activeUserAddress,
    loadVotes,
    power,
    threads,
  } = useSnapshotProposal({
    identifier: proposalId,
    snapshotId: snapshotId,
    enabled: !!snapshotLink,
  });

  const { proposal, threads: cosmosThreads } = useCosmosProposal({
    // @ts-expect-error <StrictNullChecks/>
    proposalId: proposalLink?.identifier,
    enabledApi: !!proposalLink,
  });
  useEffect(() => {
    proposal?.isFetched?.once('redraw', forceRerender);

    return () => {
      proposal?.isFetched?.removeAllListeners();
    };
  }, [proposal, forceRerender]);

  const snapShotVotingResult = React.useMemo(() => {
    if (!snapshotProposal || !votes) return [];
    const { choices } = snapshotProposal;
    const totalVoteCount = totals.sumOfResultsBalance || 0;

    return choices.map((label: string, index: number) => {
      const voteCount = votes
        .filter((vote) => vote.choice === index + 1)
        .reduce((sum, vote) => sum + vote.balance, 0);
      const percentage =
        totalVoteCount > 0
          ? ((voteCount / totalVoteCount) * 100).toFixed(2)
          : '0';
      const results = voteCount.toFixed(4); // Adjust precision as needed

      return {
        label,
        percentage,
        results,
      };
    });
  }, [votes, totals.sumOfResultsBalance, snapshotProposal]);

  const governanceUrl = `https://snapshot.box/#/s:${snapshotId}/proposal/${proposalId}`;

  const [contentUrlBodyToFetch, setContentUrlBodyToFetch] = useState<
    string | null
  >(null);

  useRunOnceOnCondition({
    callback: () => {
      thread?.contentUrl && setContentUrlBodyToFetch(thread?.contentUrl);
    },
    shouldRun: !!thread?.contentUrl,
  });

  const { data: contentUrlBody, isLoading: isLoadingContentBody } =
    useGetContentByUrlQuery({
      contentUrl: contentUrlBodyToFetch || '',
      enabled: !!contentUrlBodyToFetch,
    });

  const [activeThreadVersionId, setActiveThreadVersionId] = useState<number>();
  const [threadBody, setThreadBody] = useState(thread?.body);

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const { contestsData } = useCommunityContests();
  const isTopicInContest = checkIsTopicInContest(
    contestsData.all,
    thread?.topic?.id,
  );

  const { isAIEnabled } = useAIFeatureEnabled();

  const { aiCommentsToggleEnabled, selectedModels } = useUserAiSettingsStore();

  const effectiveAiCommentsToggleEnabled =
    isAIEnabled && aiCommentsToggleEnabled;

  const [streamingInstances, setStreamingInstances] = useState<
    StreamingReplyInstance[]
  >([]);

  const [isChatMode, setIsChatMode] = useState(false);

  const handleChatModeChange = useCallback((chatMode: boolean) => {
    setIsChatMode(chatMode);
  }, []);

  const handleGenerateAIComment = useCallback(
    async (mainThreadId: number): Promise<void> => {
      if (!effectiveAiCommentsToggleEnabled || !user.activeAccount) {
        return;
      }

      if (
        (thread?.numberOfComments && thread.numberOfComments > 0) ||
        initalAiCommentPosted.current
      ) {
        return;
      }

      const modelsToUse =
        selectedModels.length > 0
          ? selectedModels
          : [
              {
                value: DEFAULT_COMPLETION_MODEL,
                label: DEFAULT_COMPLETION_MODEL_LABEL,
              },
            ];

      const newInstances: StreamingReplyInstance[] = modelsToUse.map(
        (model) => ({
          targetCommentId: mainThreadId,
          modelId: model.value,
          modelName: model.label,
        }),
      );

      setStreamingInstances(newInstances);
      initalAiCommentPosted.current = true;
    },
    [
      effectiveAiCommentsToggleEnabled,
      user.activeAccount,
      thread,
      selectedModels,
    ],
  );

  useEffect(() => {
    if (
      isEdit === 'true' &&
      thread &&
      (isAdmin || Permissions.isThreadAuthor(thread))
    ) {
      setShouldRestoreEdits(true);
      setIsGloballyEditing(true);
      setIsEditingBody(true);
    }
    if (thread && thread?.title && !draftTitle) {
      setDraftTitle(thread.title);
    }
  }, [isEdit, thread, isAdmin, draftTitle]);

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation();

  const { actionGroups, bypassGating, isTopicGated } = useTopicGating({
    communityId,
    apiEnabled: !!user?.activeAccount?.address && !!communityId,
    userAddress: user?.activeAccount?.address || '',
    topicId: thread?.topic?.id || 0,
  });

  const { isWindowLarge } = useBrowserWindow({
    onResize: () =>
      breakpointFnValidator(
        isCollapsedSize,
        (state: boolean) => {
          setIsCollapsedSize(state);
        },
        isWindowMediumSmallInclusive,
      ),
    resizeListenerUpdateDeps: [isCollapsedSize],
  });

  useEffect(() => {
    breakpointFnValidator(
      isCollapsedSize,
      (state: boolean) => {
        setIsCollapsedSize(state);
      },
      isWindowMediumSmallInclusive,
    );
    // Note: Disabling lint rule since we only want to run it once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.THREAD_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  useManageDocumentTitle('View thread', thread?.title);

  // Imp: this correctly sets the thread body
  // 1. if content_url is provided it will fetch body from there
  // 2. else it will use available body
  // 3. it won't interfere with version history selection, unless thread body or content_url changes
  useEffect(() => {
    if (thread?.contentUrl) {
      setContentUrlBodyToFetch(thread.contentUrl);
    } else {
      setThreadBody(thread?.body || '');
      setContentUrlBodyToFetch('');
    }
  }, [thread?.body, thread?.contentUrl]);

  // Imp: this is expected to override version history selection
  useEffect(() => {
    if (contentUrlBody) {
      setThreadBody(contentUrlBody);
    }
  }, [contentUrlBody]);

  // Imp: this is expected to "not-interfere" with version history selector
  useEffect(() => {
    if (fullVersionHistory.length) {
      setActiveThreadVersionId(CURRENT_THREAD_VERSION_ID);
    }
  }, [fullVersionHistory]);

  const collaboratorLookupInfo = useMemo(() => {
    return (
      thread?.collaborators?.reduce<Record<string, string>>((acc, c) => {
        acc[c.address] = c.User?.profile.name ?? '';
        return acc;
      }, {}) ?? {}
    );
  }, [thread?.collaborators]);

  const versionHistoryOptions = useMemo(() => {
    if (!fullVersionHistory.length) {
      return [];
    }
    const fallbackTimestamp = thread?.createdAt ?? moment();
    const currentVersionTimestamp =
      thread?.updatedAt && thread.updatedAt.isAfter(fallbackTimestamp)
        ? thread?.updatedAt
        : fallbackTimestamp;
    return [
      {
        value: CURRENT_THREAD_VERSION_ID,
        timestamp: currentVersionTimestamp.valueOf(),
        label: formatVersionText(
          currentVersionTimestamp,
          thread?.author || '',
          collaboratorLookupInfo,
          thread?.profile?.name,
        ),
      },
      ...fullVersionHistory.map((v) => ({
        value: Number(v.id),
        timestamp: moment(v.timestamp).valueOf(),
        label: formatVersionText(
          moment(v.timestamp),
          v.address,
          collaboratorLookupInfo,
          thread?.profile?.name,
        ),
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ value, label }) => ({ value, label }));
  }, [
    fullVersionHistory,
    thread?.updatedAt,
    thread?.createdAt,
    thread?.author,
    collaboratorLookupInfo,
    thread?.profile?.name,
  ]);

  const effectiveVersionId = useMemo(() => {
    if (!fullVersionHistory.length) {
      return undefined;
    }
    if (activeThreadVersionId !== undefined) {
      return activeThreadVersionId;
    }
    return CURRENT_THREAD_VERSION_ID;
  }, [fullVersionHistory, activeThreadVersionId]);

  const versionHistorySelectedValue = useMemo(() => {
    return versionHistoryOptions.find((o) => o.value === effectiveVersionId);
  }, [versionHistoryOptions, effectiveVersionId]);

  const selectedVersionMoment = useMemo(() => {
    if (effectiveVersionId === CURRENT_THREAD_VERSION_ID) {
      return thread?.updatedAt && thread.updatedAt.isAfter(thread.createdAt)
        ? thread.updatedAt
        : thread?.createdAt;
    }
    const version = fullVersionHistory.find(
      (v) => Number(v.id) === effectiveVersionId,
    );
    if (version) {
      return moment(version.timestamp);
    }
    return thread?.createdAt;
  }, [
    fullVersionHistory,
    thread?.createdAt,
    thread?.updatedAt,
    effectiveVersionId,
  ]);

  const formattedThreadDate = useMemo(() => {
    if (!selectedVersionMoment?.isValid()) {
      return '';
    }
    return selectedVersionMoment.utc().local().format('Do MMM, YYYY');
  }, [selectedVersionMoment]);

  const estimatedReadMinutes = useMemo(
    () => estimateReadingTimeMinutes(threadBody || ''),
    [threadBody],
  );

  const viewThreadRenderState = resolveViewThreadRenderState({
    identifier,
    fetchThreadError,
    hasChainMeta: !!app.chain?.meta,
    isLoading,
    isLoadingContentBody,
    contentUrlBodyToFetch,
    thread,
    activeChainId: app.activeChainId(),
  });

  if (viewThreadRenderState === 'fetch_error') {
    return <PageNotFound message={fetchThreadError?.message} />;
  }

  if (viewThreadRenderState === 'loading') {
    return (
      <CWPageLayout>
        <CWContentPage
          showSkeleton
          sidebarComponentsSkeletonCount={isWindowLarge ? 2 : 0}
        />
      </CWPageLayout>
    );
  }

  if (viewThreadRenderState === 'thread_not_found') {
    return <PageNotFound message="Thread not found" />;
  }

  // Original posters have full editorial control, while added collaborators
  // merely have access to the body and title
  const isAuthor = thread && Permissions.isThreadAuthor(thread);
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  // Todo who should actually be able to view this
  const canCreateSnapshotProposal =
    app.chain?.meta?.snapshot_spaces?.length > 0 && (isAuthor || isAdminOrMod);

  const hasSnapshotProposal = thread?.links.find(
    (x) => x.source === 'snapshot',
  );

  const hasReferenceData = (thread?.links?.length || 0) > 0;

  const isMobile = isWindowSmallInclusive;
  const threadViewTabRoleAdmin = isAdminOrMod;

  const hasPollData = pollsData.length > 0;
  const canCreateOrManagePolls =
    !!isAuthor && (!app.chain?.meta?.admin_only_polling || isAdmin);
  const pollTabMobileAdminHasAffordance =
    hasPollData ||
    canCreateOrManagePolls ||
    ((!!isAuthor || threadViewTabRoleAdmin) && futarchyEnabled);

  const hasSnapshotLinkData =
    !!snapshotLink || !!proposalLink || !!hasSnapshotProposal;
  const snapshotTabMobileAdminVisible =
    hasSnapshotLinkData ||
    (!!canCreateSnapshotProposal && !hasSnapshotProposal);

  const predictionMarketResults = (
    predictionMarketsData as { results?: unknown[] } | undefined
  )?.results;
  const hasPredictionMarketData =
    Array.isArray(predictionMarketResults) &&
    predictionMarketResults.some(
      (m) =>
        (m as { status?: string }).status !== PredictionMarketStatus.Cancelled,
    );

  const hasThreadTokenData =
    tokenizedThreadsEnabled && !!threadToken?.token_address;

  const isTabVisible = (tab: ThreadViewTabName): boolean => {
    const withoutDiscussion = (t: ThreadViewTabName): boolean => {
      switch (t) {
        case 'Discussion':
          return false;
        case 'References':
          if (threadViewTabRoleAdmin) return true;
          return hasReferenceData;
        case 'Poll':
          if (!isMobile) return false;
          if (threadViewTabRoleAdmin) return pollTabMobileAdminHasAffordance;
          return hasPollData;
        case 'Snapshot':
          if (!isMobile) return false;
          if (threadViewTabRoleAdmin) return snapshotTabMobileAdminVisible;
          return hasSnapshotLinkData;
        case 'Prediction Market':
          if (!isMobile || !futarchyEnabled) return false;
          if (threadViewTabRoleAdmin) {
            return (
              hasPredictionMarketData || !!isAuthor || threadViewTabRoleAdmin
            );
          }
          return hasPredictionMarketData;
        case 'Thread Token':
          if (!isMobile) return false;
          return hasThreadTokenData;
        default:
          return false;
      }
    };

    if (tab === 'Discussion') {
      return (
        threadViewTabRoleAdmin ||
        THREAD_VIEW_TAB_NAMES.some(
          (t) => t !== 'Discussion' && withoutDiscussion(t),
        )
      );
    }

    return withoutDiscussion(tab);
  };

  const visibleThreadViewTabs = THREAD_VIEW_TAB_NAMES.filter(isTabVisible);

  const effectiveThreadViewTab = visibleThreadViewTabs.includes(
    activeThreadViewTab,
  )
    ? activeThreadViewTab
    : 'Discussion';

  const handleNewSnapshotChange = async ({
    id,
    snapshot_title,
  }: {
    id: string;
    snapshot_title: string;
  }) => {
    const newLink: Link = {
      source: LinkSource.Snapshot,
      identifier: id,
      title: snapshot_title,
    };
    const toAdd = [newLink]; // Add this line to create an array with the new link

    if (thread && toAdd.length > 0) {
      try {
        await addThreadLinks({
          thread_id: thread.id,
          links: toAdd,
        });
      } catch {
        notifyError('Failed to update linked threads');
        return;
      }
    }
  };
  const handleSnapshotChangeWrapper = ({
    id,
    snapshot_title,
  }: {
    id: string;
    snapshot_title: string;
  }) => {
    handleNewSnapshotChange({ id, snapshot_title }).catch((error) => {
      console.error('Failed to handle snapshot change:', error);
    });
  };

  const editsToSave = localStorage.getItem(
    `${app.activeChainId()}-edit-thread-${thread?.id}-storedText`,
  );
  const isStageDefault = thread && isDefaultStage(app, thread.stage);

  const showBanner = !user.activeAccount && isBannerVisible;
  const fromDiscordBot =
    thread?.discord_meta !== null && thread?.discord_meta !== undefined;

  const showLocked =
    (thread?.readOnly && !thread?.markedAsSpamAt) || fromDiscordBot;

  const canUpdateThread =
    thread &&
    user.isLoggedIn &&
    (Permissions.isSiteAdmin() ||
      Permissions.isCommunityAdmin() ||
      Permissions.isCommunityModerator() ||
      Permissions.isThreadAuthor(thread) ||
      Permissions.isThreadCollaborator(thread) ||
      (fromDiscordBot && isAdmin));

  const permissions = Permissions.getMultipleActionsPermission({
    actions: [
      GatedActionEnum.CREATE_COMMENT,
      GatedActionEnum.CREATE_COMMENT_REACTION,
    ] as const,
    thread: thread!,
    actionGroups,
    bypassGating,
  });

  const handleVersionHistoryChange = (value: number | string) => {
    const versionId = Number(value);
    if (Number.isNaN(versionId)) {
      return;
    }

    if (versionId === CURRENT_THREAD_VERSION_ID) {
      setActiveThreadVersionId(CURRENT_THREAD_VERSION_ID);
      if (thread?.contentUrl) {
        if (contentUrlBodyToFetch === thread.contentUrl && contentUrlBody) {
          setThreadBody(contentUrlBody);
          setContentUrlBodyToFetch('');
        } else {
          setContentUrlBodyToFetch(thread.contentUrl);
        }
      } else {
        setThreadBody(thread?.body || '');
        setContentUrlBodyToFetch('');
      }
      return;
    }
    const foundVersion = fullVersionHistory.find(
      (version) => Number(version.id) === versionId,
    );
    if (!foundVersion) {
      return;
    }
    setActiveThreadVersionId(Number(foundVersion.id));
    if (!foundVersion?.content_url) {
      setThreadBody(foundVersion?.body || '');
      setContentUrlBodyToFetch('');
      return;
    }
    if (contentUrlBodyToFetch === foundVersion.content_url && contentUrlBody) {
      setThreadBody(contentUrlBody);
      setContentUrlBodyToFetch('');
      return;
    }
    setContentUrlBodyToFetch(foundVersion.content_url);
  };

  const getMetaDescription = (meta: string) => {
    try {
      const parsedMeta = JSON.parse(meta);
      if (getTextFromDelta(parsedMeta)) {
        return getTextFromDelta(parsedMeta) || meta;
      } else {
        return meta;
      }
    } catch (error) {
      return;
    }
  };

  const ogTitle =
    (thread?.title?.length ?? 0 > 60)
      ? `${thread?.title?.slice?.(0, 52)}...`
      : thread?.title;
  const ogDescription =
    // @ts-expect-error <StrictNullChecks/>
    getMetaDescription(threadBody || '')?.length > 155
      ? `${getMetaDescription(threadBody || '')?.slice?.(0, 152)}...`
      : getMetaDescription(threadBody || '');
  const ogImageUrl = app?.chain?.meta?.icon_url || '';

  const scrollToFirstComment = () => {
    if (commentsRef?.current) {
      const ref = document.getElementsByClassName('Body')[0];
      ref.scrollTo({
        top: commentsRef?.current.offsetTop - 105,
        behavior: 'smooth',
      });
    }
  };

  const governanceType = proposal
    ? 'cosmos'
    : snapshotProposal
      ? 'snapshot'
      : '';
  const status = snapshotProposal?.state || proposal?.status;

  const proposalDetailSidebar = [
    ...(!isWindowSmallInclusive && (snapshotProposal || proposal)
      ? [
          {
            label: 'Detail',
            item: (
              <DetailCard
                status={status || ''}
                governanceType={governanceType || ''}
                // @ts-expect-error <StrictNullChecks/>
                publishDate={snapshotProposal?.created || proposal.createdAt}
                id={proposalId || proposalLink?.identifier}
                Threads={threads || cosmosThreads}
                scope={thread?.communityId}
              />
            ),
          },

          {
            label: 'Timeline',
            item: (
              <TimeLineCard proposalData={snapshotProposal || proposal?.data} />
            ),
          },

          {
            label: 'Results',
            item: (
              <>
                {!snapshotLink ? (
                  <VotingResults proposal={proposal as AnyProposal} />
                ) : (
                  <VotingResultView
                    voteOptions={snapShotVotingResult}
                    showCombineBarOnly={false}
                    governanceUrl={governanceUrl}
                  />
                )}
              </>
            ),
          },
        ]
      : []),
  ];
  const toggleShowVotesDrawer = (newModalState: boolean) => {
    setShowVotesDrawer(newModalState);
  };
  const toggleVotingModal = (newModalState: boolean) => {
    setVotingModalOpen(newModalState);
  };

  const onModalClose = () => {
    setVotingModalOpen(false);
  };

  const showCreateCommentComposer = shouldShowCreateCommentComposer({
    thread,
    fromDiscordBot,
    isGloballyEditing,
    isUserLoggedIn: user.isLoggedIn,
  });

  const threadLocked = !thread?.readOnly && thread?.markedAsSpamAt && (
    <div className="callout-text">
      <CWIcon iconName="flag" weight="fill" iconSize="small" />
      <CWText type="h5">
        This thread was flagged as spam on{' '}
        {moment(thread.createdAt).format('DD/MM/YYYY')}, meaning it can no
        longer be edited or commented on.
      </CWText>
    </div>
  );

  return (
    <StickCommentProvider>
      <MetaTags
        customMeta={[
          {
            name: 'title',
            content: ogTitle!,
          },
          {
            name: 'description',
            content: ogDescription!,
          },
          {
            name: 'author',
            content: thread?.author ?? '',
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
          {
            name: 'twitter:title',
            content: ogTitle!,
          },
          {
            name: 'twitter:description',
            content: ogDescription!,
          },
          {
            name: 'twitter:image',
            content: ogImageUrl,
          },
          {
            name: 'twitter:url',
            content: window.location.href,
          },
          {
            name: 'og:title',
            content: ogTitle!,
          },
          {
            name: 'og:description',
            content: ogDescription!,
          },
          {
            name: 'og:image',
            content: ogImageUrl,
          },
          {
            name: 'og:type',
            content: 'article',
          },
          {
            name: 'og:url',
            content: window.location.href,
          },
        ]}
      />

      <Helmet>
        <link
          rel="canonical"
          href={getThreadUrl({
            chain: thread?.communityId || '',
            id: threadId,
            title: thread?.title,
          })}
        />
      </Helmet>
      <CWPageLayout>
        <div className="discussion-layout">
          <div className="discussion-main">
            <div className="discussion-header">
              <div className="discussion-header-row">
                {thread?.profile?.avatarUrl && (
                  <button
                    ref={authorAvatarButtonRef}
                    type="button"
                    className="discussion-author-avatar-button"
                    {...avatarHoverProps}
                    onClick={() => setIsAuthorProfileSheetOpen((open) => !open)}
                  >
                    <CWAvatar avatarUrl={thread.profile.avatarUrl} size={40} />
                  </button>
                )}
                <div className="discussion-header-content">
                  <h1 className="discussion-thread-title">{thread?.title}</h1>
                  <div className="discussion-thread-meta">
                    {versionHistoryOptions.length > 0 ? (
                      <div className="discussion-thread-meta-version">
                        <CWSelectList
                          options={versionHistoryOptions}
                          placeholder={formattedThreadDate}
                          onChange={({
                            value,
                          }: {
                            value: number;
                            label: string;
                          }) => handleVersionHistoryChange(Number(value))}
                          formatOptionLabel={(option) =>
                            option.label.split('\n')[0]
                          }
                          isSearchable={false}
                          {...(versionHistorySelectedValue && {
                            value: versionHistorySelectedValue,
                          })}
                        />
                      </div>
                    ) : (
                      <CWText type="b2" className="discussion-thread-meta-text">
                        {formattedThreadDate}
                      </CWText>
                    )}
                    <CWText type="b2" className="discussion-thread-meta-sep">
                      /
                    </CWText>
                    <CWText type="b2" className="discussion-thread-meta-text">
                      {estimatedReadMinutes} min read
                    </CWText>
                    <CWText type="b2" className="discussion-thread-meta-sep">
                      /
                    </CWText>
                    <CWText type="b2" className="discussion-thread-meta-text">
                      {formatCompactSocialCount(thread!.viewCount)}{' '}
                      {thread!.viewCount === 1 ? 'view' : 'views'}
                    </CWText>
                  </div>
                  {visibleThreadViewTabs.length > 0 && (
                    <div className="discussion-thread-tabs-scroll">
                      <CWTabsRow className="discussion-thread-tabs">
                        {visibleThreadViewTabs.map((tabName) => (
                          <CWTab
                            key={tabName}
                            label={tabName}
                            isSelected={effectiveThreadViewTab === tabName}
                            onClick={() => setActiveThreadViewTab(tabName)}
                          />
                        ))}
                      </CWTabsRow>
                    </div>
                  )}
                </div>
              </div>
              {threadLocked}
            </div>
            <div className="discussion-content-row">
              <div className="discussion-left-rail">
                <PrimaryInteractions
                  thread={thread!}
                  upvotesCount={thread?.reactionCount ?? 0}
                  commentsCount={thread?.numberOfComments ?? 0}
                  onCommentClick={scrollToFirstComment}
                  onOpenUpvotes={() => setIsUpvoteDrawerOpen(true)}
                  shareEndpoint={`${window.location.origin}${window.location.pathname}`}
                  canUpdateThread={canUpdateThread}
                  onLockToggle={() => {
                    setIsGloballyEditing(false);
                    setIsEditingBody(false);
                  }}
                  onDelete={() => navigate('/discussions')}
                  onEditCancel={() => {
                    setIsGloballyEditing(true);
                    setIsEditingBody(true);
                  }}
                  onEditConfirm={() => {
                    setShouldRestoreEdits(true);
                    setIsGloballyEditing(true);
                    setIsEditingBody(true);
                  }}
                  onEditStart={() => {
                    if (thread && editsToSave) {
                      clearEditingLocalStorage(thread.id, ContentType.Thread);
                      setSavedEdits(editsToSave || '');
                    }
                    setIsGloballyEditing(true);
                    setIsEditingBody(true);
                  }}
                  onSpamToggle={() => {
                    setIsGloballyEditing(false);
                    setIsEditingBody(false);
                  }}
                  hasPendingEdits={!!editsToSave}
                  editingDisabled={isTopicInContest}
                />
              </div>
              <div className="discussion-scroll-area" ref={pageRef}>
                <div className="discussion-scroll-content">
                  {effectiveThreadViewTab === 'Discussion' ? (
                    <>
                      {isGloballyEditing ? (
                        <EditBody
                          title={draftTitle}
                          savedEdits={savedEdits}
                          shouldRestoreEdits={shouldRestoreEdits}
                          thread={thread!}
                          activeThreadBody={threadBody || ''}
                          cancelEditing={() => {
                            setIsGloballyEditing(false);
                            setIsEditingBody(false);
                            setShouldRestoreEdits(false);
                          }}
                          threadUpdatedCallback={(title, body) => {
                            setDraftTitle(title);
                            setThreadBody(body);
                            setIsGloballyEditing(false);
                            setIsEditingBody(false);
                            setShouldRestoreEdits(false);
                            refetchThread().catch(console.error);
                          }}
                          isDisabled={isTopicInContest}
                        />
                      ) : (
                        <>
                          <MarkdownViewerWithFallback
                            key={threadBody}
                            markdown={threadBody || ''}
                            className="discussion-thread-body"
                            cutoffLines={50}
                            maxChars={MIN_CHARS_TO_SHOW_MORE}
                          />
                          <div
                            className="discussion-comments-section"
                            ref={commentsRef}
                          >
                            <CommentTree
                              pageRef={pageRef}
                              commentsRef={commentsRef}
                              thread={thread!}
                              setIsGloballyEditing={setIsGloballyEditing}
                              canComment={permissions.CREATE_COMMENT.allowed}
                              canReact={
                                permissions.CREATE_COMMENT_REACTION.allowed
                              }
                              canReply={permissions.CREATE_COMMENT.allowed}
                              fromDiscordBot={fromDiscordBot}
                              onThreadCreated={handleGenerateAIComment}
                              aiCommentsToggleEnabled={
                                !!effectiveAiCommentsToggleEnabled
                              }
                              streamingInstances={streamingInstances}
                              setStreamingInstances={setStreamingInstances}
                              permissions={permissions}
                              onChatModeChange={handleChatModeChange}
                            />
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="discussion-thread-tab-panel">
                      {effectiveThreadViewTab === 'Poll' && (
                        <PollCard thread={thread!} />
                      )}
                      {effectiveThreadViewTab === 'Snapshot' && (
                        <SnapshotCard
                          thread={thread!}
                          onSnapshotSaved={handleSnapshotChangeWrapper}
                        />
                      )}
                      {effectiveThreadViewTab === 'Prediction Market' && (
                        <PredictionMarketCard thread={thread!} />
                      )}
                      {effectiveThreadViewTab === 'Thread Token' && (
                        <ThreadTokenCard
                          thread={thread!}
                          onLaunchClick={() => setIsTokenDrawerOpen(true)}
                        />
                      )}
                      {effectiveThreadViewTab === 'References' && (
                        <ReferencesCard
                          thread={thread!}
                          canManageReferences={threadViewTabRoleAdmin}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="discussion-sidebar">
            {!isMobile && (
              <>
                <div className="discussion-sidebar-create-stack">
                  <SnapshotCard
                    thread={thread!}
                    onSnapshotSaved={handleSnapshotChangeWrapper}
                  />
                  <PredictionMarketCard thread={thread!} />
                  <ThreadTokenCard
                    thread={thread!}
                    onLaunchClick={() => setIsTokenDrawerOpen(true)}
                  />
                </div>
                <div className="discussion-sidebar-polls">
                  <PollCard thread={thread!} />
                </div>
              </>
            )}
          </div>
          <div className="discussion-sticky-composer">
            {showCreateCommentComposer && (
              <WithDefaultStickyComment>
                <CreateComment
                  rootThread={thread!}
                  canComment={permissions.CREATE_COMMENT.allowed}
                  tooltipText={permissions.CREATE_COMMENT.tooltip}
                  aiCommentsToggleEnabled={!!effectiveAiCommentsToggleEnabled}
                />
              </WithDefaultStickyComment>
            )}
            <StickyCommentElementSelector />
          </div>
        </div>
      </CWPageLayout>
      <ViewThreadUpvotesDrawer
        thread={thread}
        isOpen={isUpvoteDrawerOpen}
        setIsOpen={setIsUpvoteDrawerOpen}
      />
      {thread?.id && (
        <ThreadTokenDrawer
          threadId={thread.id}
          isOpen={isTokenDrawerOpen}
          setIsOpen={setIsTokenDrawerOpen}
        />
      )}
      {thread?.profile?.userId ? (
        <ThreadAuthorProfileSheet
          userId={thread.profile.userId}
          isOpen={isAuthorProfileSheetOpen}
          onClose={() => setIsAuthorProfileSheetOpen(false)}
          anchorRef={authorAvatarButtonRef}
          popoverHoverProps={popoverHoverProps}
        />
      ) : null}
    </StickCommentProvider>
  );
};

export default ViewThreadPage;
