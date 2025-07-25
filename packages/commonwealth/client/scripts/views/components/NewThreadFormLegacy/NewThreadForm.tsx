import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  canUserPerformGatedAction,
  DisabledCommunitySpamTier,
  GatedActionEnum,
  LinkSource,
} from '@hicommonwealth/shared';
import {
  SnapshotProposal,
  SnapshotSpace,
} from 'client/scripts/helpers/snapshot_utils';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import useForceRerender from 'client/scripts/hooks/useForceRerender';
import useGetThreadsQuery from 'client/scripts/state/api/threads/getThreads';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {
  getEthChainIdOrBech32Prefix,
  SessionKeyError,
} from 'controllers/server/sessions';
import { weightedVotingValueToLabel } from 'helpers';
import { detectURL } from 'helpers/threads';
import useAppStatus from 'hooks/useAppStatus';
import { useFlag } from 'hooks/useFlag';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useTopicGating from 'hooks/useTopicGating';
import type { Topic } from 'models/Topic';
import { AnyProposal, ThreadKind, ThreadStage } from 'models/types';
import { useCommonNavigate } from 'navigation/helpers';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { useAiCompletion } from 'state/api/ai';
import {
  generateThreadPrompt,
  generateThreadTitlePrompt,
} from 'state/api/ai/prompts';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useGetUserEthBalanceQuery } from 'state/api/communityStake';
import useFetchProfileByIdQuery from 'state/api/profiles/fetchProfileById';
import {
  useAddThreadLinksMutation,
  useCreateThreadMutation,
  useCreateThreadPollMutation,
} from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import { useAuthModalStore } from 'state/ui/modals';
import useUserStore, { useUserAiSettingsStore } from 'state/ui/user';
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
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../../modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';

import { DeltaStatic } from 'quill';
// eslint-disable-next-line max-len
import useCreateThreadTokenMutation from 'client/scripts/state/api/threads/createThreadToken';
import {
  useGetTokenByCommunityId,
  useGetTokenizedThreadsAllowedQuery,
} from 'client/scripts/state/api/tokens';
import { useAIFeatureEnabled } from 'state/ui/user';
import { ExtendedPoll, LocalPoll, parseCustomDuration } from 'utils/polls';
// eslint-disable-next-line max-len
import { convertAddressToDropdownOption } from '../../modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import ProposalVotesDrawer from '../../pages/NewProposalViewPage/ProposalVotesDrawer/ProposalVotesDrawer';
import { useCosmosProposal } from '../../pages/NewProposalViewPage/useCosmosProposal';
import { useSnapshotProposal } from '../../pages/NewProposalViewPage/useSnapshotProposal';
import { SnapshotPollCardContainer } from '../../pages/Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import { ThreadPollCard } from '../../pages/view_thread/ThreadPollCard';
import { ThreadPollEditorCard } from '../../pages/view_thread/ThreadPollEditorCard';
import { LinkedProposalsCard } from '../../pages/view_thread/linked_proposals_card';
import { ImageActionCard } from '../ImageActionCard/ImageActionCard';
import { ImageActionModal } from '../ImageActionModal/ImageActionModal';
import { ProposalState } from '../NewThreadFormModern/NewThreadForm';
import { CWGatedTopicBanner } from '../component_kit/CWGatedTopicBanner';
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
  getImageUrlsFromDelta,
  getTextFromDelta,
  serializeDelta,
} from '../react_quill_editor/utils';
import ContestTopicBanner from './ContestTopicBanner';
import './NewThreadForm.scss';
import { TokenWidget } from './ToketWidget';
import { checkNewThreadErrors, useNewThreadForm } from './helpers';

const MIN_ETH_FOR_CONTEST_THREAD = 0.0005;

interface NewThreadFormProps {
  onCancel?: (e: React.MouseEvent | undefined) => void;
  onContentAppended?: (markdown: string) => void;
  onContentDeltaChange?: (markdown: string) => void;
  contentDelta?: DeltaStatic;
  setContentDelta?: (delta: DeltaStatic) => void;
  webSearchEnabled?: boolean;
  setWebSearchEnabled?: (enabled: boolean) => void;
  communityId?: string;
}

export interface NewThreadFormHandles {
  openImageModal: () => void;
  appendContent: (markdown: string) => void;
}

// eslint-disable-next-line react/display-name
export const NewThreadForm = forwardRef<
  NewThreadFormHandles,
  NewThreadFormProps
>(
  (
    {
      onCancel,
      onContentAppended,
      onContentDeltaChange,
      contentDelta,
      setContentDelta,
      webSearchEnabled,
      setWebSearchEnabled,
      communityId,
    },
    ref,
  ) => {
    const navigate = useCommonNavigate();
    const location = useLocation();
    const forceRerender = useForceRerender();
    const { isWindowSmallInclusive } = useBrowserWindow({});
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [showVotesDrawer, setShowVotesDrawer] = useState(false);
    const [votingModalOpen, setVotingModalOpen] = useState(false);
    const [proposalRedrawState, redrawProposals] = useState<boolean>(true);
    const [linkedProposals, setLinkedProposals] =
      useState<ProposalState | null>();
    const [pollsData, setPollData] = useState<LocalPoll[]>();
    const tokenizedThreadsEnabled = useFlag('tokenizedThreads');

    // --- State for Image Modal Context ---
    const [imageModalContext, setImageModalContext] = useState<{
      initialReferenceText?: string;
      initialReferenceImageUrls?: string[];
    } | null>(null);

    const { mutateAsync: createPoll } = useCreateThreadPollMutation();
    const { mutateAsync: createThreadToken } = useCreateThreadTokenMutation();

    const user = useUserStore();
    const { data: userProfile } = useFetchProfileByIdQuery({
      userId: user.id,
      apiCallEnabled: !!user.id,
    });

    const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
      useUserAiSettingsStore();
    const { isAIEnabled } = useAIFeatureEnabled();

    useAppStatus();

    const isInsideCommunity = !!app.chain; // if this is not set user is not inside community

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
      setCanShowTopicPermissionBanner,
    } = useNewThreadForm(selectedCommunityId, topicsForSelector, {
      contentDelta,
      setContentDelta,
    });

    const { data: recentThreads } = useGetThreadsQuery({
      cursor: 1,
      limit: 2,
      community_id: selectedCommunityId,
      enabled: !!selectedCommunityId && !!threadTopic?.id,
      topic_id: threadTopic?.id,
    });

    const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation();

    const { generateCompletion } = useAiCompletion();
    const [isGenerating, setIsGenerating] = useState(false);

    const hasTopicOngoingContest =
      threadTopic?.active_contest_managers?.length ?? 0 > 0;

    const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

    const contestTopicError = threadTopic?.active_contest_managers?.length
      ? threadTopic?.active_contest_managers
          ?.map(
            (acm) =>
              acm?.content?.filter(
                (c) => c.actor_address === userSelectedAddress,
              ).length || 0,
          )
          ?.every((n) => n >= 2)
      : false;

    const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
    const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();

    const { actionGroups, bypassGating } = useTopicGating({
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

    const bodyAccumulatedRef = useRef('');

    const isWalletBalanceErrorEnabled = false;
    const walletBalanceError =
      isContestAvailable &&
      hasTopicOngoingContest &&
      isWalletBalanceErrorEnabled &&
      parseFloat(userEthBalance || '0') < MIN_ETH_FOR_CONTEST_THREAD;

    const threadPermissions = Permissions.getCreateThreadPermission({
      actionGroups,
      bypassGating,
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
      (selectedCommunityId && !threadPermissions.allowed) ||
      isLoadingCommunity ||
      (isInsideCommunity && (!userSelectedAddress || !selectedCommunityId)) ||
      isDisabled ||
      isGenerating ||
      (isTurnstileEnabled && !turnstileToken);

    // Define default values for title and body
    const DEFAULT_THREAD_TITLE = 'Untitled Discussion';
    const DEFAULT_THREAD_BODY = 'No content provided.';

    const [localWebSearchEnabled, setLocalWebSearchEnabled] = useState(false);
    const effectiveWebSearchEnabled =
      typeof webSearchEnabled === 'boolean'
        ? webSearchEnabled
        : localWebSearchEnabled;
    const effectiveSetWebSearchEnabled =
      setWebSearchEnabled || setLocalWebSearchEnabled;

    const { data: tokenizedThreadsAllowed } =
      useGetTokenizedThreadsAllowedQuery({
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

      if (
        !canUserPerformGatedAction(
          actionGroups,
          GatedActionEnum.CREATE_THREAD,
          bypassGating,
        )
      ) {
        notifyError('Topic is gated!');
        return;
      }

      if (!isDiscussion && !detectURL(threadUrl)) {
        notifyError('Must provide a valid URL.');
        return;
      }

      // In AI mode, provide default values so the backend validation is not broken.
      const effectiveTitle = isAIEnabled
        ? threadTitle.trim() || DEFAULT_THREAD_TITLE
        : threadTitle;

      const effectiveBody = isAIEnabled
        ? getTextFromDelta(threadContentDelta).trim()
          ? serializeDelta(threadContentDelta)
          : DEFAULT_THREAD_BODY
        : serializeDelta(threadContentDelta);

      if (!isAIEnabled) {
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
              app.chain?.meta?.namespace_governance_address || '',
            chainRpc: community.ChainNode?.url || '',
            paymentTokenAddress: communityToken.token_address,
          });

          notifySuccess('Thread token created successfully');
        }

        if (thread && linkedProposals) {
          addThreadLinks({
            thread_id: thread.id!,
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
            thread_id: thread.id!,
            prompt: pollsData[0]?.prompt,
            options: pollsData[0]?.options,
            duration: parseCustomDuration(pollsData[0]?.custom_duration),
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
        notifyError(err.message);

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
      userSelectedAddress,
      selectedCommunityId,
      isTurnstileEnabled,
      turnstileToken,
      actionGroups,
      bypassGating,
      isDiscussion,
      threadUrl,
      threadTitle,
      threadContentDelta,
      setIsSaving,
      threadKind,
      threadTopic,
      hasTopics,
      createThread,
      tokenizedThreadsAllowed?.tokenized_threads_enabled,
      linkedProposals,
      pollsData,
      setThreadContentDelta,
      clearDraft,
      isInsideCommunity,
      navigate,
      checkForSessionKeyRevalidationErrors,
      user,
      resetTurnstile,
      communityToken?.token_address,
      communityToken?.symbol,
      createThreadToken,
      addThreadLinks,
      createPoll,
      isAIEnabled,
    ]);

    const handleCancel = (e: React.MouseEvent | undefined) => {
      setThreadTitle('');
      setThreadTopic(
        topicsForSelector.find((t) => t.name.includes('General'))!,
      );
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

      const recentThreadsContext = recentThreads?.pages[0]?.results
        .map((thread) => {
          return (
            `Title: ${thread.title}\nBody: ${thread.body}\n` +
            `Topic: ${thread.topic?.name || 'N/A'}\nCommunity: ${thread.community_id || 'N/A'}`
          );
        })
        .join('\n\n');

      try {
        const { systemPrompt: bodySystemPrompt, userPrompt: bodyUserPrompt } =
          generateThreadPrompt(
            recentThreadsContext || 'Suggest a new discussion topic.',
          );

        await generateCompletion(bodyUserPrompt, {
          model: 'gpt-4o-mini',
          stream: true,
          systemPrompt: bodySystemPrompt,
          includeContextualMentions: true,
          communityId: communityId || selectedCommunityId,
          onError: (error) => {
            console.error('Error generating AI thread body:', error);
            notifyError('Failed to generate AI thread content');
            setIsGenerating(false);
          },
          onChunk: (chunk) => {
            bodyAccumulatedRef.current += chunk;
            setThreadContentDelta(
              createDeltaFromText(bodyAccumulatedRef.current.trimStart()),
            );
          },
          onComplete: (generatedBody) => {
            const {
              systemPrompt: titleSystemPrompt,
              userPrompt: titleUserPrompt,
            } = generateThreadTitlePrompt(generatedBody.trim() || 'New Thread');

            void (async () => {
              try {
                await generateCompletion(titleUserPrompt, {
                  model: 'gpt-4o-mini',
                  stream: false,
                  systemPrompt: titleSystemPrompt,
                  includeContextualMentions: true,
                  communityId: communityId || selectedCommunityId,
                  onComplete(fullTitle) {
                    setThreadTitle(fullTitle.trim());
                    setIsGenerating(false);
                  },
                  onError: (titleError) => {
                    console.error(
                      'Error generating AI thread title:',
                      titleError,
                    );
                    notifyError('Failed to generate AI thread title');
                    setIsGenerating(false);
                  },
                });
              } catch (error) {
                console.error(
                  'Error awaiting title generation in AI thread:',
                  error,
                );
                notifyError('Failed to initiate AI thread title generation');
                setIsGenerating(false);
              }
            })();
          },
        });
      } catch (error) {
        console.error('Error in AI thread generation process:', error);
        notifyError('Failed to generate AI thread content or title');
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

    const [isCollapsed, setIsCollapsed] = useState(false);

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

    const handleAppendContent = useCallback(
      (markdown: string) => {
        const currentText = getTextFromDelta(threadContentDelta);
        const combinedText = currentText
          ? `${currentText}\n\n${markdown}`
          : markdown;
        const newDelta = createDeltaFromText(combinedText, true);
        setThreadContentDelta(newDelta);
        forceRerender();
      },
      [threadContentDelta, setThreadContentDelta, forceRerender],
    );

    useEffect(() => {
      if (onContentAppended) {
        // This effect ensures that if the prop function changes, we are aware,
        // but the actual appending happens via handleAppendContent.
        // The parent will call handleAppendContent via a ref method.
      }
    }, [onContentAppended, handleAppendContent]);

    const handleOpenImageModal = useCallback(() => {
      const currentContent = getTextFromDelta(threadContentDelta);
      const imageUrls = getImageUrlsFromDelta(threadContentDelta);
      const communityName = community?.name;
      const topicName = threadTopic?.name;

      let combinedContextText = currentContent;
      if (communityName) {
        combinedContextText = `Community: ${communityName}\n${combinedContextText}`;
      }
      if (topicName) {
        combinedContextText = `Topic: ${topicName}\n${combinedContextText}`;
      }

      setImageModalContext({
        initialReferenceText: combinedContextText || undefined,
        initialReferenceImageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      setIsImageModalOpen(true);
    }, [threadContentDelta, community, threadTopic]);

    const handleCloseImageModal = useCallback(() => {
      setIsImageModalOpen(false);
    }, []);

    const handleApplyImage = useCallback(
      (imageUrl: string) => {
        const currentText = getTextFromDelta(threadContentDelta);
        const imageMarkdown = `![Generated image](${imageUrl})`;
        const combinedText = currentText + imageMarkdown;
        const newDelta = createDeltaFromText(combinedText, true);
        setThreadContentDelta(newDelta);

        handleCloseImageModal();
      },
      [threadContentDelta, setThreadContentDelta, handleCloseImageModal],
    );

    const sidebarComponent = [
      tokenizedThreadsEnabled
        ? {
            label: 'Links',
            item: (
              <div className="cards-colum">
                <TokenWidget />
              </div>
            ),
          }
        : {},
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
                  {(pollsData || []).map((poll) => {
                    return (
                      <ThreadPollCard
                        poll={poll as unknown as ExtendedPoll}
                        key={(poll as unknown as ExtendedPoll).id}
                        actionGroups={actionGroups}
                        bypassGating={bypassGating}
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
      {
        label: 'Image',
        item: (
          <div className="cards-column">
            <ImageActionCard onClick={handleOpenImageModal} />
          </div>
        ),
      },
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
                <TimeLineCard
                  proposalData={snapshotProposal || proposal?.data}
                />
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

    React.useImperativeHandle(ref, () => ({
      openImageModal: handleOpenImageModal,
      appendContent: handleAppendContent,
    }));

    // Wrap setThreadContentDelta to also call onContentDeltaChange
    const setThreadContentDeltaWithCallback = useCallback(
      (delta) => {
        setThreadContentDelta(delta);
        if (onContentDeltaChange) {
          const text = getTextFromDelta(delta);
          onContentDeltaChange(text);
        }
      },
      [setThreadContentDelta, onContentDeltaChange],
    );

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
                            .filter(
                              (a) => a.community.id === selectedCommunityId,
                            )
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
                                (t) =>
                                  String(t.id) === originalProps.data.value,
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

                  {tokenizedThreadsAllowed && tokenizedThreadsEnabled && (
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
                    setContentDelta={setThreadContentDeltaWithCallback}
                    {...(selectedCommunityId && {
                      isDisabled: !threadPermissions.allowed,
                      tooltipLabel: threadPermissions.tooltip,
                    })}
                    // eslint-disable-next-line max-len
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

                    {isAIEnabled && (
                      <div className="ai-toggle-wrapper">
                        <CWToggle
                          className="ai-toggle"
                          icon="binoculars"
                          iconColor="#757575"
                          checked={effectiveWebSearchEnabled}
                          onChange={() =>
                            effectiveSetWebSearchEnabled(
                              !effectiveWebSearchEnabled,
                            )
                          }
                        />
                        <CWText type="caption" className="toggle-label">
                          Web search
                        </CWText>
                      </div>
                    )}

                    {isAIEnabled && (
                      <CWThreadAction
                        action="ai-reply"
                        label="Draft thread with AI"
                        onClick={(e) => {
                          e.preventDefault();
                          handleGenerateAIThread().catch(console.error);
                        }}
                      />
                    )}

                    {isAIEnabled && (
                      <div className="ai-toggle-wrapper">
                        <CWToggle
                          className="ai-toggle"
                          icon="sparkle"
                          iconColor="#757575"
                          checked={aiCommentsToggleEnabled}
                          onChange={() => {
                            setAICommentsToggleEnabled(
                              !aiCommentsToggleEnabled,
                            );
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

                  {canShowGatingBanner && (
                    <div>
                      <CWGatedTopicBanner
                        actions={[GatedActionEnum.CREATE_THREAD]}
                        actionGroups={actionGroups}
                        bypassGating={bypassGating}
                        onClose={() => setCanShowGatingBanner(false)}
                      />
                    </div>
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
        <ImageActionModal
          isOpen={isImageModalOpen}
          onClose={handleCloseImageModal}
          onApply={handleApplyImage}
          initialReferenceText={imageModalContext?.initialReferenceText}
          initialReferenceImageUrls={
            imageModalContext?.initialReferenceImageUrls
          }
        />
        {JoinCommunityModals}
      </>
    );
  },
);

export default NewThreadForm;
