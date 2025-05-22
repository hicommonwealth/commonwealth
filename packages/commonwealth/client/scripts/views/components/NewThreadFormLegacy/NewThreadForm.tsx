import { PermissionEnum, TopicWeightedVoting } from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {
  SessionKeyError,
  getEthChainIdOrBech32Prefix,
} from 'controllers/server/sessions';
import { weightedVotingValueToLabel } from 'helpers';
import { detectURL, getThreadActionTooltipText } from 'helpers/threads';
import { useFlag } from 'hooks/useFlag';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useTopicGating from 'hooks/useTopicGating';
import type { Topic } from 'models/Topic';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { useAiCompletion } from 'state/api/ai';
import {
  generateThreadPrompt,
  generateThreadTitlePrompt,
} from 'state/api/ai/prompts';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useGetUserEthBalanceQuery } from 'state/api/communityStake';
import { useFetchGroupsQuery } from 'state/api/groups';
import useFetchProfileByIdQuery from 'state/api/profiles/fetchProfileById';
import {
  useAddThreadLinksMutation,
  useCreateThreadMutation,
  useCreateThreadPollMutation,
} from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import useCreateThreadTokenMutation from 'state/api/threads/createThreadToken';
import useFetchThreadsQuery from 'state/api/threads/fetchThreads';
import useGetTokenizedThreadsAllowedQuery from 'state/api/tokens/getTokenizedThreadsAllowed';
import { useFetchTopicsQuery } from 'state/api/topics';
import { useAuthModalStore } from 'state/ui/modals';
import useUserStore, { useLocalAISettingsStore } from 'state/ui/user';
import Permissions from 'utils/Permissions';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import CustomTopicOption from 'views/components/NewThreadFormLegacy/CustomTopicOption';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import { useTurnstile } from 'views/components/useTurnstile';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import useAppStatus from '../../../hooks/useAppStatus';
import { AnyProposal, ThreadKind, ThreadStage } from '../../../models/types';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../../modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';

import { DisabledCommunitySpamTier, LinkSource } from '@hicommonwealth/shared';
import {
  SnapshotProposal,
  SnapshotSpace,
} from 'client/scripts/helpers/snapshot_utils';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import useForceRerender from 'client/scripts/hooks/useForceRerender';

import Poll from 'client/scripts/models/Poll';
// eslint-disable-next-line max-len
import { useGetTokenByCommunityId } from 'state/api/tokens';
import { convertAddressToDropdownOption } from '../../modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import ProposalVotesDrawer from '../../pages/NewProposalViewPage/ProposalVotesDrawer/ProposalVotesDrawer';
import { useCosmosProposal } from '../../pages/NewProposalViewPage/useCosmosProposal';
import { useSnapshotProposal } from '../../pages/NewProposalViewPage/useSnapshotProposal';
import { SnapshotPollCardContainer } from '../../pages/Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import { ThreadPollCard } from '../../pages/view_thread/ThreadPollCard';
import { ThreadPollEditorCard } from '../../pages/view_thread/ThreadPollEditorCard';
import { LinkedProposalsCard } from '../../pages/view_thread/linked_proposals_card';
import { ProposalState } from '../NewThreadFormModern/NewThreadForm';
import { CWGatedTopicBanner } from '../component_kit/CWGatedTopicBanner';
import { CWGatedTopicPermissionLevelBanner } from '../component_kit/CWGatedTopicPermissionLevelBanner';
import { CWText } from '../component_kit/cw_text';
import CWBanner from '../component_kit/new_designs/CWBanner';
import { CWSelectList } from '../component_kit/new_designs/CWSelectList';
import { CWThreadAction } from '../component_kit/new_designs/cw_thread_action';
import { CWToggle } from '../component_kit/new_designs/cw_toggle';
import DetailCard from '../proposals/DetailCard';
import TimeLineCard from '../proposals/TimeLineCard';
import VotingResultView from '../proposals/VotingResultView';
import { VotingActions } from '../proposals/voting_actions';
import { VotingResults } from '../proposals/voting_results';
import { ReactQuillEditor } from '../react_quill_editor';
import {
  createDeltaFromText,
  getTextFromDelta,
  serializeDelta,
} from '../react_quill_editor/utils';
import ContestTopicBanner from './ContestTopicBanner';
import './NewThreadForm.scss';
import { checkNewThreadErrors, useNewThreadForm } from './helpers';

const MIN_ETH_FOR_CONTEST_THREAD = 0.0005;

interface NewThreadFormProps {
  onCancel?: (e: React.MouseEvent | undefined) => void;
}
export interface ExtendedPoll extends Poll {
  customDuration?: string;
}
export const NewThreadForm = ({ onCancel }: NewThreadFormProps) => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [showVotesDrawer, setShowVotesDrawer] = useState(false);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [proposalRedrawState, redrawProposals] = useState<boolean>(true);
  const [linkedProposals, setLinkedProposals] =
    useState<ProposalState | null>();
  const [pollsData, setPollData] = useState<ExtendedPoll[]>();

  const { mutateAsync: createPoll } = useCreateThreadPollMutation();
  const { mutateAsync: createThreadToken } = useCreateThreadTokenMutation();

  const user = useUserStore();
  const { data: userProfile } = useFetchProfileByIdQuery({
    userId: user.id,
    apiCallEnabled: !!user.id,
  });

  const {
    aiInteractionsToggleEnabled,
    aiCommentsToggleEnabled,
    setAICommentsToggleEnabled,
  } = useLocalAISettingsStore();
  const aiCommentsFeatureEnabled = useFlag('aiComments');

  useAppStatus();

  const isInsideCommunity = !!app.chain; // if this is not set user is not inside community

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [selectedCommunityId, setSelectedCommunityId] = useState(
    app.activeChainId() || '',
  );

  const [userSelectedAddress, setUserSelectedAddress] = useState(
    user?.activeAccount?.address,
  );
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: selectedCommunityId,
      includeNodeInfo: true,
      enabled: !!selectedCommunityId,
    });
  const chainRpc = community?.ChainNode?.url || '';
  const ethChainId = community?.ChainNode?.eth_chain_id || 0;

  const { data: topics = [], refetch: refreshTopics } = useFetchTopicsQuery({
    communityId: selectedCommunityId,
    includeContestData: true,
    apiEnabled: !!selectedCommunityId,
  });

  const { isContestAvailable } = useCommunityContests();

  const sortedTopics: Topic[] = [...topics].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const hasTopics = sortedTopics?.length;
  const topicsForSelector = hasTopics ? sortedTopics : [];

  const {
    threadTitle,
    setThreadTitle,
    threadKind,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    threadContentDelta,
    setThreadContentDelta,
    setIsSaving,
    isDisabled,
    clearDraft,
    canShowGatingBanner,
    setCanShowGatingBanner,
    canShowTopicPermissionBanner,
    setCanShowTopicPermissionBanner,
  } = useNewThreadForm(selectedCommunityId, topicsForSelector);

  const { data: recentThreads } = useFetchThreadsQuery({
    queryType: 'bulk',
    limit: 2,
    communityId: selectedCommunityId,
    apiEnabled: !!selectedCommunityId && !!threadTopic?.id,
    topicId: threadTopic?.id,
  });

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    communityId: app.activeChainId() || '',
  });

  const { generateCompletion } = useAiCompletion();
  const [isGenerating, setIsGenerating] = useState(false);

  const hasTopicOngoingContest =
    threadTopic?.active_contest_managers?.length ?? 0 > 0;

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const contestTopicError = threadTopic?.active_contest_managers?.length
    ? threadTopic?.active_contest_managers
        ?.map(
          (acm) =>
            acm?.content?.filter((c) => c.actor_address === userSelectedAddress)
              .length || 0,
        )
        ?.every((n) => n >= 2)
    : false;

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId: selectedCommunityId,
    includeTopics: true,
    enabled: !!selectedCommunityId,
  });
  const { isRestrictedMembership, foundTopicPermissions } = useTopicGating({
    communityId: selectedCommunityId,
    userAddress: userSelectedAddress || '',
    apiEnabled: !!userSelectedAddress && !!selectedCommunityId,
    topicId: threadTopic?.id || 0,
  });

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId: selectedCommunityId,
  });

  const { data: userEthBalance } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: userSelectedAddress || '',
    apiEnabled:
      isContestAvailable &&
      !!userSelectedAddress &&
      Number(ethChainId) > 0 &&
      !!chainRpc,
    ethChainId: ethChainId || 0,
  });

  const isDiscussion = threadKind === ThreadKind.Discussion;

  const gatedGroupNames = groups
    .filter((group) =>
      group.topics.find((topic) => topic.id === threadTopic?.id),
    )
    .map((group) => group.name);

  const bodyAccumulatedRef = useRef('');

  const isWalletBalanceErrorEnabled = false;
  const walletBalanceError =
    isContestAvailable &&
    hasTopicOngoingContest &&
    isWalletBalanceErrorEnabled &&
    parseFloat(userEthBalance || '0') < MIN_ETH_FOR_CONTEST_THREAD;

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!userSelectedAddress,
    isThreadTopicGated: isRestrictedMembership,
    threadTopicInteractionRestrictions:
      !isAdmin &&
      !foundTopicPermissions?.permissions?.includes(
        PermissionEnum.CREATE_THREAD,
      )
        ? foundTopicPermissions?.permissions
        : undefined,
  });

  const {
    turnstileToken,
    isTurnstileEnabled,
    TurnstileWidget,
    resetTurnstile,
  } = useTurnstile({
    action: 'create-thread',
  });

  const buttonDisabled =
    !user.activeAccount ||
    !userSelectedAddress ||
    walletBalanceError ||
    contestTopicError ||
    (selectedCommunityId && !!disabledActionsTooltipText) ||
    isLoadingCommunity ||
    (isInsideCommunity && (!userSelectedAddress || !selectedCommunityId)) ||
    isDisabled ||
    isGenerating ||
    (isTurnstileEnabled && !turnstileToken);

  // Define default values for title and body
  const DEFAULT_THREAD_TITLE = 'Untitled Discussion';
  const DEFAULT_THREAD_BODY = 'No content provided.';

  const { data: tokenizedThreadsAllowed } = useGetTokenizedThreadsAllowedQuery({
    community_id: selectedCommunityId,
    topic_id: threadTopic?.id || 0,
  });

  const { data: communityToken } = useGetTokenByCommunityId({
    community_id: selectedCommunityId,
    with_stats: true,
    enabled: !!selectedCommunityId,
  });

  const handleNewThreadCreation = useCallback(async () => {
    if (!community || !userSelectedAddress || !selectedCommunityId) {
      notifyError('Invalid form state!');
      return;
    }

    if (isTurnstileEnabled && !turnstileToken) {
      notifyError('Please complete the verification');
      return;
    }

    if (isRestrictedMembership) {
      notifyError('Topic is gated!');
      return;
    }

    if (!isDiscussion && !detectURL(threadUrl)) {
      notifyError('Must provide a valid URL.');
      return;
    }

    // In AI mode, provide default values so the backend validation is not broken.
    const effectiveTitle = aiInteractionsToggleEnabled
      ? threadTitle.trim() || DEFAULT_THREAD_TITLE
      : threadTitle;

    const effectiveBody = aiInteractionsToggleEnabled
      ? getTextFromDelta(threadContentDelta).trim()
        ? serializeDelta(threadContentDelta)
        : DEFAULT_THREAD_BODY
      : serializeDelta(threadContentDelta);

    if (!aiInteractionsToggleEnabled) {
      const deltaString = JSON.stringify(threadContentDelta);
      checkNewThreadErrors(
        { threadKind, threadUrl, threadTitle, threadTopic },
        deltaString,
        !!hasTopics,
      );
    }

    setIsSaving(true);

    try {
      if (!threadTopic) {
        console.error('NewThreadForm: No topic selected');
        notifyError('Please select a topic');
        return;
      }

      const input = await buildCreateThreadInput({
        address: userSelectedAddress || '',
        kind: threadKind,
        stage: ThreadStage.Discussion,
        communityId: selectedCommunityId,
        communityBase: community.base,
        title: effectiveTitle,
        topic: threadTopic,
        body: effectiveBody,
        url: threadUrl,
        ethChainIdOrBech32Prefix: getEthChainIdOrBech32Prefix({
          base: community.base,
          bech32_prefix: community?.bech32_prefix || '',
          eth_chain_id: community?.ChainNode?.eth_chain_id || 0,
        }),
        turnstileToken,
      });

      const thread = await createThread(input);

      if (tokenizedThreadsAllowed?.tokenized_threads_enabled) {
        if (!communityToken?.token_address) {
          notifyError('Community token not found');
          return;
        }

        if (!community?.ChainNode?.id) {
          notifyError('chainId not found');
          return;
        }

        await createThreadToken({
          name: community.id,
          symbol: communityToken.symbol,
          threadId: thread.id!,
          ethChainId: app?.chain?.meta?.ChainNode?.eth_chain_id || 0,
          initPurchaseAmount: 1e18,
          chainId: community.ChainNode?.id,
          walletAddress: userSelectedAddress,
          authorAddress: userSelectedAddress,
          communityTreasuryAddress:
            (app.chain?.meta as any)?.communityTreasuryAddress || '',
          chainRpc: community.ChainNode?.url || '',
          paymentTokenAddress: communityToken.token_address,
        });

        notifySuccess('Thread token created successfully');
      }

      if (thread && linkedProposals) {
        addThreadLinks({
          communityId: app.activeChainId() || '',
          threadId: thread.id!,
          links: [
            {
              source: linkedProposals.source as LinkSource,
              identifier: linkedProposals.identifier,
              title: linkedProposals.title,
            },
          ],
        }).catch(console.error);
      }

      if (thread && pollsData && pollsData?.length) {
        await createPoll({
          threadId: thread.id,
          prompt: pollsData[0]?.prompt,
          options: pollsData[0]?.options,
          customDuration: pollsData[0]?.customDuration || undefined,
          authorCommunity: user.activeAccount?.community?.id || '',
          address: user.activeAccount?.address || '',
        });
      }

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      // Construct the correct navigation path
      const communityPrefix = isInsideCommunity
        ? ''
        : `/${selectedCommunityId}`;
      const navigationUrl = `${communityPrefix}/discussion/${thread.id}-${thread.title}`;

      navigate(navigationUrl);
    } catch (err) {
      if (err instanceof SessionKeyError) {
        console.log('NewThreadForm: Session key error detected');
        checkForSessionKeyRevalidationErrors(err);

        // Reset turnstile if there's an error
        resetTurnstile();
      }

      if (err?.message?.includes('Exceeded content creation limit')) {
        console.log('NewThreadForm: Content creation limit exceeded');
        notifyError(
          'Exceeded content creation limit. Please try again later based on your trust level.',
        );
        return;
      }

      if (err?.message?.includes('limit')) {
        console.log('NewThreadForm: Contest limit exceeded');
        notifyError(
          'Limit of submitted threads in selected contest has been exceeded.',
        );
        // Reset turnstile if there's an error
        resetTurnstile();
      }

      console.error('NewThreadForm: Unhandled error:', err?.message);
      notifyError('Failed to create thread');

      // Reset turnstile if there's an error
      resetTurnstile();
    } finally {
      setIsSaving(false);
      if (!isInsideCommunity) {
        user.setData({
          addressSelectorSelectedAddress: undefined,
        });
      }
    }
  }, [
    community,
    createThread,
    isInsideCommunity,
    isRestrictedMembership,
    isDiscussion,
    threadUrl,
    threadTopic,
    threadKind,
    threadContentDelta,
    threadTitle,
    setIsSaving,
    setThreadContentDelta,
    clearDraft,
    navigate,
    selectedCommunityId,
    userSelectedAddress,
    hasTopics,
    checkForSessionKeyRevalidationErrors,
    user,
    aiInteractionsToggleEnabled,
    isTurnstileEnabled,
    turnstileToken,
    resetTurnstile,
    addThreadLinks,
    linkedProposals,
    createPoll,
    pollsData,
    createThreadToken,
    tokenizedThreadsAllowed,
    communityToken,
  ]);

  const handleCancel = (e: React.MouseEvent | undefined) => {
    setThreadTitle('');
    setThreadTopic(topicsForSelector.find((t) => t.name.includes('General'))!);
    setThreadContentDelta(createDeltaFromText(''));

    if (location.search.includes('cancel')) {
      navigate(`/contests/${location.search.split('cancel=')[1]}`);
    } else {
      onCancel?.(e) || navigate('/discussions');
    }
  };

  const showBanner =
    selectedCommunityId && !userSelectedAddress && isBannerVisible;

  const contestTopicAffordanceVisible =
    isContestAvailable && hasTopicOngoingContest;

  const handleGenerateAIThread = async () => {
    setIsGenerating(true);
    setThreadTitle('');
    setThreadContentDelta(createDeltaFromText(''));
    bodyAccumulatedRef.current = '';

    const context = recentThreads
      ?.map((thread) => {
        return `Title: ${thread.title}
              \n Body: ${thread.body}
              \n Topic: ${thread.topic?.name || 'N/A'}
              \n Community: ${thread.communityName || 'N/A'}`;
      })
      .join('\n\n');

    try {
      const prompt = generateThreadPrompt(context);

      const threadContent = await generateCompletion(prompt, {
        model: 'gpt-4o-mini',
        stream: true,
        onError: (error) => {
          console.error('Error generating AI thread:', error);
          notifyError('Failed to generate AI thread content');
        },
        onChunk: (chunk) => {
          bodyAccumulatedRef.current += chunk;
          setThreadContentDelta(
            createDeltaFromText(bodyAccumulatedRef.current),
          );
        },
      });

      const titlePrompt = generateThreadTitlePrompt(threadContent);

      await generateCompletion(titlePrompt, {
        stream: false,
        onComplete(fullText) {
          setThreadTitle(fullText);
        },
      });
    } catch (error) {
      console.error('Error generating AI thread:', error);
      notifyError('Failed to generate AI thread');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    refreshTopics().catch(console.error);
  }, [refreshTopics]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void handleNewThreadCreation();
      }
    },
    [handleNewThreadCreation],
  );
  const forceRerender = useForceRerender();

  const snapshotLink = linkedProposals?.source === 'snapshot';
  const cosmosLink = linkedProposals?.source === 'proposal';
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
    identifier: linkedProposals?.proposalId || '',
    snapshotId: linkedProposals?.snapshotIdentifier || '',
    enabled: !!snapshotLink,
  });

  const { proposal, threads: cosmosThreads } = useCosmosProposal({
    proposalId: linkedProposals?.identifier || '',
    enabled: !!cosmosLink,
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

  // eslint-disable-next-line max-len
  const governanceUrl = `https://snapshot.box/#/s:${linkedProposals?.snapshotIdentifier}/proposal/${linkedProposals?.proposalId}`;

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
  const sidebarComponent = [
    {
      label: 'Links',
      item: (
        <div className="cards-colum">
          {/* Note : Hiding this as the CommonTrade Modal is Broken for base sepollia. */}
          {/* <TokenWidget /> */}
        </div>
      ),
    },
    {
      label: 'Links',
      item: (
        <div className="cards-column">
          <LinkedProposalsCard
            thread={null}
            showAddProposalButton={true}
            setLinkedProposals={setLinkedProposals}
            linkedProposals={linkedProposals}
            communityId={selectedCommunityId}
          />
        </div>
      ),
    },
    ...((pollsData && pollsData?.length > 0) ||
    !app.chain?.meta?.admin_only_polling ||
    isAdmin
      ? [
          {
            label: 'Polls',
            item: (
              <div className="cards-column">
                {[
                  ...new Map(
                    pollsData?.map((poll) => [poll?.id, poll]),
                  ).values(),
                ].map((poll: Poll) => {
                  return (
                    <ThreadPollCard
                      poll={poll}
                      key={poll.id}
                      isTopicMembershipRestricted={isRestrictedMembership}
                      showDeleteButton={true}
                      isCreateThreadPage={true}
                      setLocalPoll={setPollData}
                    />
                  );
                })}
                {(!app.chain?.meta?.admin_only_polling || isAdmin) && (
                  <ThreadPollEditorCard
                    threadAlreadyHasPolling={!pollsData?.length}
                    setLocalPoll={setPollData}
                    isCreateThreadPage={true}
                    threadTitle={threadTitle}
                    threadContentDelta={threadContentDelta}
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const proposalDetailSidebar = [
    ...(!isWindowSmallInclusive && (snapshotProposal || proposal)
      ? [
          {
            label: 'Detail',
            item: (
              <DetailCard
                status={status || ''}
                governanceType={governanceType}
                // @ts-expect-error <StrictNullChecks/>
                publishDate={snapshotProposal?.created || proposal.createdAt}
                id={linkedProposals?.proposalId}
                Threads={threads || cosmosThreads}
                scope={selectedCommunityId}
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

  return (
    <>
      <CWPageLayout>
        <div className="NewThreadForm" onKeyDown={handleKeyDown}>
          <div className="form-view">
            <div className="new-thread-body">
              <div className="new-thread-form-inputs">
                {!isInsideCommunity && (
                  <>
                    <CWSelectList
                      className="community-select"
                      options={user?.communities?.map((c) => ({
                        label: c.name,
                        value: c.id,
                      }))}
                      placeholder="Select community"
                      {...(selectedCommunityId && {
                        value: {
                          label:
                            user.communities.find(
                              (c) => c.id === selectedCommunityId,
                            )?.name || '',
                          value: selectedCommunityId,
                        },
                      })}
                      onChange={(option) => {
                        option?.value && setSelectedCommunityId(option.value);
                        setUserSelectedAddress('');
                      }}
                    />
                    <CWSelectList
                      components={{
                        Option: (originalProps) =>
                          CustomAddressOption({
                            originalProps,
                            selectedAddressValue: userSelectedAddress || '',
                          }),
                      }}
                      noOptionsMessage={() => 'No available Metamask address'}
                      {...(userSelectedAddress && {
                        value: convertAddressToDropdownOption(
                          userSelectedAddress || '',
                        ),
                      })}
                      formatOptionLabel={(option) => (
                        <CustomAddressOptionElement
                          value={option.value}
                          label={option.label}
                          selectedAddressValue={userSelectedAddress || ''}
                        />
                      )}
                      placeholder="Select address"
                      isClearable={false}
                      isSearchable={false}
                      options={(
                        user.addresses
                          .filter((a) => a.community.id === selectedCommunityId)
                          .map((a) => a.address) || []
                      )?.map(convertAddressToDropdownOption)}
                      onChange={(option) =>
                        option?.value && setUserSelectedAddress(option.value)
                      }
                    />
                  </>
                )}

                <div className="thread-title-row">
                  <div className="thread-title-row-left">
                    <CWTextInput
                      fullWidth
                      autoFocus
                      placeholder="Title"
                      value={threadTitle}
                      tabIndex={1}
                      onInput={(e) => setThreadTitle(e.target.value)}
                    />
                  </div>
                </div>

                {!!hasTopics && !!threadTopic && (
                  <CWSelectList
                    className="topic-select"
                    components={{
                      Option: (originalProps) =>
                        CustomTopicOption({
                          originalProps,
                          topic: topicsForSelector.find(
                            (t) => String(t.id) === originalProps.data.value,
                          ),
                          helpText: weightedVotingValueToLabel(
                            topicsForSelector.find(
                              (t) => String(t.id) === originalProps.data.value,
                            )?.weighted_voting as TopicWeightedVoting,
                          ),
                        }),
                    }}
                    formatOptionLabel={(option) => (
                      <>
                        {!!contestTopicAffordanceVisible && (
                          <CWIcon
                            className="trophy-icon"
                            iconName="trophy"
                            iconSize="small"
                          />
                        )}
                        {option.label}
                      </>
                    )}
                    options={sortedTopics.map((topic) => ({
                      label: topic?.name,
                      value: `${topic?.id}`,
                    }))}
                    defaultValue={{
                      label: threadTopic?.name,
                      value: `${threadTopic?.id}`,
                    }}
                    {...(!!location.search &&
                      threadTopic?.name &&
                      threadTopic?.id && {
                        value: {
                          label: threadTopic?.name,
                          value: `${threadTopic?.id}`,
                        },
                      })}
                    placeholder="Select topic"
                    customError={
                      contestTopicError
                        ? 'Can no longer post in this topic while contest is active.'
                        : ''
                    }
                    onChange={(topic) => {
                      if (!topic) return;
                      setCanShowGatingBanner(true);
                      setCanShowTopicPermissionBanner(true);
                      const foundTopic = topicsForSelector.find(
                        (t) => `${t.id}` === topic.value,
                      );
                      if (foundTopic) {
                        setThreadTopic(foundTopic);
                      }
                    }}
                  />
                )}

                {tokenizedThreadsAllowed && (
                  <div className="tokenized-status">
                    <CWText
                      type="caption"
                      className={
                        tokenizedThreadsAllowed.tokenized_threads_enabled
                          ? 'tokenized-enabled'
                          : 'tokenized-disabled'
                      }
                    >
                      {tokenizedThreadsAllowed.tokenized_threads_enabled
                        ? 'This topic allows tokenized threads'
                        : 'This topic does not allow tokenized threads'}
                    </CWText>
                  </div>
                )}

                {!!contestTopicAffordanceVisible && (
                  <ContestTopicBanner
                    contests={threadTopic?.active_contest_managers?.map(
                      (acm) => {
                        return {
                          name: acm?.name,
                          address: acm?.contest_address,
                          submittedEntries:
                            acm?.content?.filter(
                              (c) => c.actor_address === userSelectedAddress,
                            ).length || 0,
                        };
                      },
                    )}
                  />
                )}

                {!isDiscussion && (
                  <CWTextInput
                    placeholder="https://"
                    value={threadUrl}
                    tabIndex={2}
                    onInput={(e) => setThreadUrl(e.target.value)}
                  />
                )}

                <ReactQuillEditor
                  contentDelta={threadContentDelta}
                  setContentDelta={setThreadContentDelta}
                  {...(selectedCommunityId && {
                    isDisabled:
                      isRestrictedMembership ||
                      !!disabledActionsTooltipText ||
                      !userSelectedAddress,
                    tooltipLabel:
                      typeof disabledActionsTooltipText === 'function'
                        ? disabledActionsTooltipText?.('submit')
                        : disabledActionsTooltipText,
                  })}
                  placeholder="Enter text or drag images and media here. Use the tab button to see your formatted post."
                />

                <MessageRow
                  hasFeedback={!!walletBalanceError}
                  statusMessage={`Ensure that your connected wallet has at least
                ${MIN_ETH_FOR_CONTEST_THREAD} ETH to participate.`}
                  validationStatus="failure"
                />

                {community &&
                  userProfile &&
                  community.spam_tier_level !== DisabledCommunitySpamTier &&
                  userProfile.tier <= community.spam_tier_level && (
                    <CWBanner
                      type="warning"
                      body={
                        "Your post will be marked as spam due to the Community's Trust Settings. " +
                        'You can increase your trust level by verifying an SSO or adding a wallet with Balance.'
                      }
                      className="spam-trust-banner"
                    />
                  )}

                {isTurnstileEnabled && <TurnstileWidget />}

                <div className="buttons-row">
                  <CWButton
                    buttonType="tertiary"
                    onClick={handleCancel}
                    tabIndex={3}
                    label="Cancel"
                    containerClassName="no-pad cancel-button"
                  />

                  {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
                    <CWThreadAction
                      action="ai-reply"
                      label="Draft thread with AI"
                      onClick={(e) => {
                        e.preventDefault();
                        handleGenerateAIThread().catch(console.error);
                      }}
                    />
                  )}

                  {aiCommentsFeatureEnabled && aiInteractionsToggleEnabled && (
                    <div className="ai-toggle-wrapper">
                      <CWToggle
                        className="ai-toggle"
                        icon="sparkle"
                        iconColor="#757575"
                        checked={aiCommentsToggleEnabled}
                        onChange={() => {
                          setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
                        }}
                      />
                      <CWText type="caption" className="toggle-label">
                        AI initial comment
                      </CWText>
                    </div>
                  )}

                  <CWButton
                    label="Create"
                    disabled={buttonDisabled}
                    onClick={() => {
                      handleNewThreadCreation().catch(console.error);
                    }}
                    tabIndex={4}
                    containerClassName="no-pad create-button"
                  />
                </div>

                {showBanner && (
                  <JoinCommunityBanner
                    onClose={handleCloseBanner}
                    onJoin={() => {
                      handleJoinCommunity().catch(console.error);
                    }}
                  />
                )}

                {isRestrictedMembership && canShowGatingBanner && (
                  <div>
                    <CWGatedTopicBanner
                      groupNames={gatedGroupNames}
                      onClose={() => setCanShowGatingBanner(false)}
                    />
                  </div>
                )}

                {canShowTopicPermissionBanner &&
                  foundTopicPermissions &&
                  !isAdmin &&
                  !foundTopicPermissions?.permissions?.includes(
                    PermissionEnum.CREATE_THREAD,
                  ) && (
                    <CWGatedTopicPermissionLevelBanner
                      topicPermissions={
                        foundTopicPermissions?.permissions as PermissionEnum[]
                      }
                      onClose={() => setCanShowTopicPermissionBanner(false)}
                    />
                  )}
              </div>
            </div>
            <>
              {isWindowSmallInclusive && (snapshotProposal || proposal) && (
                <>
                  <DetailCard
                    status={status || ''}
                    governanceType={governanceType}
                    publishDate={
                      // @ts-expect-error <StrictNullChecks/>
                      snapshotProposal?.created || proposal.createdAt
                    }
                    id={linkedProposals?.proposalId}
                    Threads={threads || cosmosThreads}
                    scope={selectedCommunityId}
                  />
                  <TimeLineCard
                    proposalData={snapshotProposal || proposal?.data}
                  />
                </>
              )}
              {snapshotProposal ? (
                <>
                  <SnapshotPollCardContainer
                    activeUserAddress={activeUserAddress}
                    fetchedPower={!!power}
                    identifier={linkedProposals?.proposalId || ''}
                    proposal={snapshotProposal as SnapshotProposal}
                    scores={[]}
                    space={space as SnapshotSpace}
                    symbol={symbol}
                    totals={totals}
                    totalScore={totalScore}
                    validatedAgainstStrategies={validatedAgainstStrategies}
                    votes={votes}
                    loadVotes={async () => loadVotes()}
                    snapShotVotingResult={snapShotVotingResult}
                    toggleShowVotesDrawer={toggleShowVotesDrawer}
                  />
                  {isWindowSmallInclusive && (
                    <VotingResultView
                      voteOptions={snapShotVotingResult}
                      showCombineBarOnly={false}
                      governanceUrl={governanceUrl}
                    />
                  )}
                  <ProposalVotesDrawer
                    header="Votes"
                    votes={votes}
                    choices={snapshotProposal?.choices}
                    isOpen={showVotesDrawer}
                    setIsOpen={setShowVotesDrawer}
                  />
                </>
              ) : (
                <>
                  {proposal && (
                    <>
                      <VotingActions
                        onModalClose={onModalClose}
                        proposal={proposal}
                        toggleVotingModal={toggleVotingModal}
                        votingModalOpen={votingModalOpen}
                        redrawProposals={redrawProposals}
                        proposalRedrawState={proposalRedrawState}
                        toggleShowVotesDrawer={toggleShowVotesDrawer}
                      />
                      {isWindowSmallInclusive && (
                        <VotingResults proposal={proposal} />
                      )}
                    </>
                  )}
                </>
              )}
              {isWindowSmallInclusive && (
                <div className="action-cards">
                  {sidebarComponent.map((view) => (
                    <div key={view.label}>{view.item}</div>
                  ))}
                </div>
              )}
            </>
          </div>
          {!isWindowSmallInclusive && (
            <div className="sidebar">
              <div className="actions">
                <div className="left-container">
                  <CWIcon
                    iconName="squaresFour"
                    iconSize="medium"
                    weight="bold"
                  />
                  <CWText type="h5" fontWeight="semiBold">
                    Actions
                  </CWText>
                </div>
                <CWIcon
                  iconName={isCollapsed ? 'caretDown' : 'caretUp'}
                  iconSize="small"
                  className="caret-icon"
                  weight="bold"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                />
              </div>

              {!isCollapsed &&
                sidebarComponent?.map((c) => (
                  <React.Fragment key={c?.label}>{c?.item}</React.Fragment>
                ))}
              {proposalDetailSidebar &&
                proposalDetailSidebar.map((c) => (
                  <React.Fragment key={c?.label}>{c?.item}</React.Fragment>
                ))}
            </div>
          )}
        </div>
      </CWPageLayout>
      {JoinCommunityModals}
    </>
  );
};

export default NewThreadForm;
