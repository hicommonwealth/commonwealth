import { GetThreadToken } from '@hicommonwealth/schemas';
import {
  ContentType,
  DEFAULT_COMPLETION_MODEL,
  DEFAULT_COMPLETION_MODEL_LABEL,
  GatedActionEnum,
  getThreadUrl,
} from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import useForceRerender from 'client/scripts/hooks/useForceRerender';
import { useInitChainIfNeeded } from 'client/scripts/hooks/useInitChainIfNeeded';
import useGetThreadByIdQuery from 'client/scripts/state/api/threads/getThreadById';
import useGetThreadToken from 'client/scripts/state/api/tokens/getThreadToken';
import { notifyError } from 'controllers/app/notifications';
import useCommunityContests from 'features/contests/hooks/useCommunityContests';
import { isDefaultStage } from 'helpers';
import { filterLinks } from 'helpers/threads';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useTopicGating from 'hooks/useTopicGating';
import { useCommonNavigate } from 'navigation/helpers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBrowserAnalyticsTrack } from 'shared/hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'shared/hooks/useBrowserWindow';
import useRunOnceOnCondition from 'shared/hooks/useRunOnceOnCondition';
import app from 'state';
import useGetContentByUrlQuery from 'state/api/general/getContentByUrl';
import useFetchProfilesByAddressesQuery from 'state/api/profiles/fetchProfilesByAddress';
import {
  useAddThreadLinksMutation,
  useGetThreadPollsQuery,
} from 'state/api/threads';
import useUserStore, {
  useAIFeatureEnabled,
  useUserAiSettingsStore,
} from 'state/ui/user';
import { checkIsTopicInContest } from 'views/components/NewThreadForm/helpers';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from 'views/components/component_kit/helpers';
import { z } from 'zod';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import { Link, LinkSource } from '../../../models/Thread';
import Permissions from '../../../utils/Permissions';
import { getTextFromDelta } from '../../components/react_quill_editor/';
import { useCosmosProposal } from '../NewProposalViewPage/useCosmosProposal';
import { useSnapshotProposal } from '../NewProposalViewPage/useSnapshotProposal';
import { StreamingReplyInstance } from '../discussions/CommentTree/TreeHierarchy';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import {
  resolveViewThreadRenderState,
  shouldShowCreateCommentComposer,
  shouldShowJoinCommunityBanner,
} from './viewThreadPage.contracts';

type ViewThreadPageProps = {
  identifier: string;
};

type VoterProfileData = {
  address: string;
  name: string;
  avatarUrl?: string;
};

const getMetaDescription = (meta: string) => {
  try {
    const parsedMeta = JSON.parse(meta);
    if (getTextFromDelta(parsedMeta)) {
      return getTextFromDelta(parsedMeta) || meta;
    }

    return meta;
  } catch {
    return;
  }
};

export const useViewThreadData = ({ identifier }: ViewThreadPageProps) => {
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
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [hideGatingBanner, setHideGatingBanner] = useState(false);
  const initalAiCommentPosted = useRef(false);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [proposalRedrawState, redrawProposals] = useState<boolean>(true);
  const [imageActionModalOpen, setImageActionModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  useInitChainIfNeeded(app);
  const user = useUserStore();
  const commentsRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const forceRerender = useForceRerender();
  const { isAddedToHomeScreen } = useAppStatus();
  const communityId = app.activeChainId() || '';

  const {
    data: threadView,
    error: fetchThreadError,
    isLoading,
  } = useGetThreadByIdQuery(threadId, !!threadId && !!communityId);

  const { data: pollsData = [] } = useGetThreadPollsQuery({
    threadId: +threadId,
    apiCallEnabled: !!threadId && !!communityId,
  });

  const { data: threadToken } = useGetThreadToken({
    thread_id: threadId,
    enabled: !!threadId && !!communityId,
  });

  const thread = useMemo(() => threadView, [threadView]);

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
    snapshotId,
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
      const results = voteCount.toFixed(4);

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
      thread?.contentUrl && setContentUrlBodyToFetch(thread.contentUrl);
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
      selectedModels,
      thread,
      user.activeAccount,
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
    if (thread && thread.title && !draftTitle) {
      setDraftTitle(thread.title);
    }
  }, [draftTitle, isAdmin, isEdit, thread]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.THREAD_PAGE_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  useManageDocumentTitle('View thread', thread?.title);

  useEffect(() => {
    if (thread?.contentUrl) {
      setContentUrlBodyToFetch(thread.contentUrl);
    } else {
      setThreadBody(thread?.body || '');
      setContentUrlBodyToFetch('');
    }
  }, [thread?.body, thread?.contentUrl]);

  useEffect(() => {
    if (contentUrlBody) {
      setThreadBody(contentUrlBody);
    }
  }, [contentUrlBody]);

  useEffect(() => {
    if (thread?.versionHistory) {
      setActiveThreadVersionId(
        Math.max(...thread.versionHistory.map(({ id }) => id)),
      );
    }
  }, [thread?.versionHistory]);

  const uniqueVoterAddresses = useMemo(() => {
    if (pollsData.length > 0) {
      const allAddresses = pollsData.flatMap((poll) =>
        (poll.votes || []).map((vote) => vote.address),
      );
      return Array.from(new Set(allAddresses));
    }

    return [];
  }, [pollsData]);

  const { data: fetchedProfiles, isLoading: isLoadingProfiles } =
    useFetchProfilesByAddressesQuery({
      currentChainId: communityId,
      profileChainIds: [communityId],
      profileAddresses: uniqueVoterAddresses,
      apiCallEnabled: !!communityId && uniqueVoterAddresses.length > 0,
    });

  const voterProfiles = useMemo(() => {
    if (!fetchedProfiles || fetchedProfiles.length === 0) {
      return {};
    }

    const profilesMap: Record<string, VoterProfileData> = {};
    fetchedProfiles.forEach((profile) => {
      if (profile.address) {
        profilesMap[profile.address] = {
          address: profile.address,
          name: profile.name || '',
          avatarUrl: profile.avatarUrl,
        };
      }
    });

    return profilesMap;
  }, [fetchedProfiles]);

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

  const isAuthor = Boolean(thread && Permissions.isThreadAuthor(thread));
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const linkedSnapshots = filterLinks(thread?.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread?.links, LinkSource.Proposal);
  const linkedThreads = filterLinks(thread?.links, LinkSource.Thread);

  const showLinkedProposalOptions =
    linkedSnapshots.length > 0 ||
    linkedProposals.length > 0 ||
    isAuthor ||
    isAdminOrMod;

  const canCreateSnapshotProposal =
    (app.chain?.meta?.snapshot_spaces?.length || 0) > 0 &&
    (isAuthor || isAdminOrMod);

  const showLinkedThreadOptions =
    linkedThreads.length > 0 || isAuthor || isAdminOrMod;

  const hasSnapshotProposal = thread?.links.find(
    (x) => x.source === 'snapshot',
  );
  const hasWebLinks = thread?.links.find((x) => x.source === 'web');

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
    const toAdd = [newLink];

    if (thread && toAdd.length > 0) {
      try {
        await addThreadLinks({
          thread_id: thread.id,
          links: toAdd,
        });
      } catch {
        notifyError('Failed to update linked threads');
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
  const isStageDefault = thread ? isDefaultStage(app, thread.stage) : false;

  const showBanner = shouldShowJoinCommunityBanner({
    hasActiveAccount: !!user.activeAccount,
    isBannerVisible,
  });
  const fromDiscordBot =
    thread?.discord_meta !== null && thread?.discord_meta !== undefined;

  const showLocked =
    (thread?.readOnly && !thread?.markedAsSpamAt) || fromDiscordBot;

  const canUpdateThread = Boolean(
    thread &&
      user.isLoggedIn &&
      (Permissions.isSiteAdmin() ||
        Permissions.isCommunityAdmin() ||
        Permissions.isCommunityModerator() ||
        Permissions.isThreadAuthor(thread) ||
        Permissions.isThreadCollaborator(thread) ||
        (fromDiscordBot && isAdmin)),
  );

  const commentPermissionActions = [
    GatedActionEnum.CREATE_COMMENT,
    GatedActionEnum.CREATE_COMMENT_REACTION,
  ] as const;

  const permissions = thread
    ? Permissions.getMultipleActionsPermission({
        actions: commentPermissionActions,
        thread,
        actionGroups,
        bypassGating,
      })
    : {
        [GatedActionEnum.CREATE_COMMENT]: {
          allowed: false,
          tooltip: '',
        },
        [GatedActionEnum.CREATE_COMMENT_REACTION]: {
          allowed: false,
          tooltip: '',
        },
      };

  const handleVersionHistoryChange = (versionId: number) => {
    const foundVersion = (thread?.versionHistory || []).find(
      (version) => version.id === versionId,
    );
    foundVersion && setActiveThreadVersionId(foundVersion.id);
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

  const ogTitle =
    (thread?.title?.length ?? 0) > 60
      ? `${thread?.title?.slice?.(0, 52)}...`
      : thread?.title;
  const ogDescription =
    (getMetaDescription(threadBody || '')?.length || 0) > 155
      ? `${getMetaDescription(threadBody || '')?.slice?.(0, 152)}...`
      : getMetaDescription(threadBody || '');
  const ogImageUrl = app?.chain?.meta?.icon_url || '';

  const scrollToFirstComment = () => {
    if (commentsRef.current) {
      const ref = document.getElementsByClassName('Body')[0];
      ref.scrollTo({
        top: commentsRef.current.offsetTop - 105,
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

  const handleDeleteThread = () => navigate('/discussions');

  const handleLockOrSpamToggle = () => {
    setIsGloballyEditing(false);
    setIsEditingBody(false);
  };

  const handleEditCancel = () => {
    setIsGloballyEditing(true);
    setIsEditingBody(true);
  };

  const handleEditConfirm = () => {
    setShouldRestoreEdits(true);
    setIsGloballyEditing(true);
    setIsEditingBody(true);
  };

  const handleEditStart = () => {
    if (thread && editsToSave) {
      clearEditingLocalStorage(thread.id, ContentType.Thread);
      setSavedEdits(editsToSave);
    }

    setIsGloballyEditing(true);
    setIsEditingBody(true);
  };

  const handleDraftTitleChange = (title?: string) => {
    setDraftTitle(title || '');
  };

  const canonicalThreadUrl = getThreadUrl({
    chain: thread?.communityId || '',
    id: threadId,
    title: thread?.title,
  });

  return {
    activeThreadVersionId,
    actionGroups,
    activeUserAddress,
    bypassGating,
    canCreateSnapshotProposal,
    canUpdateThread,
    canonicalThreadUrl,
    commentsRef,
    cosmosThreads,
    draftTitle,
    editsToSave,
    effectiveAiCommentsToggleEnabled,
    fetchThreadError,
    fromDiscordBot,
    futarchyEnabled,
    governanceType,
    governanceUrl,
    hasSnapshotProposal,
    hasWebLinks,
    handleChatModeChange,
    handleCloseBanner,
    handleDeleteThread,
    handleDraftTitleChange,
    handleEditCancel,
    handleEditConfirm,
    handleEditStart,
    handleGenerateAIComment,
    handleJoinCommunity,
    handleLockOrSpamToggle,
    handleSnapshotChangeWrapper,
    handleVersionHistoryChange,
    hideGatingBanner,
    identifier,
    imageActionModalOpen,
    isAdmin,
    isAdminOrMod,
    isAuthor,
    isBannerVisible,
    isChatMode,
    isCollapsed,
    isEditingBody,
    isGloballyEditing,
    isLoadingProfiles,
    isStageDefault,
    isTopicGated,
    isTopicInContest,
    isWindowLarge,
    isWindowSmallInclusive,
    JoinCommunityModals,
    linkedProposals,
    linkedSnapshots,
    linkedThreads,
    loadVotes,
    ogDescription,
    ogImageUrl,
    ogTitle,
    onModalClose,
    pageRef,
    permissions,
    pollsData,
    power,
    proposal,
    proposalId,
    proposalLink,
    proposalRedrawState,
    redrawProposals,
    savedEdits,
    setHideGatingBanner,
    setImageActionModalOpen,
    setIsCollapsed,
    setIsEditingBody,
    setIsGloballyEditing,
    setShouldRestoreEdits,
    setShowVotesDrawer,
    setStreamingInstances,
    shouldRestoreEdits,
    showBanner,
    showCreateCommentComposer,
    showLinkedProposalOptions,
    showLinkedThreadOptions,
    showLocked,
    showVotesDrawer,
    scrollToFirstComment,
    snapShotVotingResult,
    snapshotLink,
    snapshotProposal,
    space,
    status,
    streamingInstances,
    symbol,
    thread,
    threadBody,
    threadId,
    threadToken: (threadToken ?? null) as z.infer<
      typeof GetThreadToken.output
    > | null,
    threads,
    tokenizedThreadsEnabled,
    toggleShowVotesDrawer,
    toggleVotingModal,
    totalScore,
    totals,
    user,
    validatedAgainstStrategies,
    viewThreadRenderState,
    voterProfiles,
    votes,
    votingModalOpen,
  };
};

export type UseViewThreadDataResult = ReturnType<typeof useViewThreadData>;
