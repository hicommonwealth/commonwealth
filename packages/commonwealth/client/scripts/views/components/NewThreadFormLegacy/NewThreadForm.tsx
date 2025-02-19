import { PermissionEnum, TopicWeightedVoting } from '@hicommonwealth/schemas';
import { notifyError } from 'controllers/app/notifications';
import {
  SessionKeyError,
  getEthChainIdOrBech32Prefix,
} from 'controllers/server/sessions';
import { weightedVotingValueToLabel } from 'helpers';
import { detectURL, getThreadActionTooltipText } from 'helpers/threads';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useTopicGating from 'hooks/useTopicGating';
import type { Topic } from 'models/Topic';
import { useCommonNavigate } from 'navigation/helpers';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useGetUserEthBalanceQuery } from 'state/api/communityStake';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useCreateThreadMutation } from 'state/api/threads';
import { buildCreateThreadInput } from 'state/api/threads/createThread';
import { useFetchTopicsQuery } from 'state/api/topics';
import { useAuthModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import CustomTopicOption from 'views/components/NewThreadFormLegacy/CustomTopicOption';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import useAppStatus from '../../../hooks/useAppStatus';
import { ThreadKind, ThreadStage } from '../../../models/types';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../../modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { useGenerateCommentText } from 'client/scripts/state/api/comments/generateCommentText';
import { convertAddressToDropdownOption } from '../../modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import { CWGatedTopicBanner } from '../component_kit/CWGatedTopicBanner';
import { CWGatedTopicPermissionLevelBanner } from '../component_kit/CWGatedTopicPermissionLevelBanner';
import { CWSelectList } from '../component_kit/new_designs/CWSelectList';
import { CWThreadAction } from '../component_kit/new_designs/cw_thread_action';
import { CWToggle } from '../component_kit/new_designs/cw_toggle';
import { ReactQuillEditor } from '../react_quill_editor';
import {
  createDeltaFromText,
  getTextFromDelta,
  serializeDelta,
} from '../react_quill_editor/utils';
import ContestThreadBanner from './ContestThreadBanner';
import ContestTopicBanner from './ContestTopicBanner';
import './NewThreadForm.scss';
import { checkNewThreadErrors, useNewThreadForm } from './helpers';

interface NewThreadFormProps {
  onCancel?: (event?: React.MouseEvent) => void;
  aiCommentsToggleEnabled: boolean;
  setAICommentsToggleEnabled: (enabled: boolean) => void;
  onAiGenerate: (text: string) => Promise<string>;
}

const MIN_ETH_FOR_CONTEST_THREAD = 0.0005;

export const NewThreadForm: React.FC<NewThreadFormProps> = ({
  onCancel = () => {},
  aiCommentsToggleEnabled,
  setAICommentsToggleEnabled,
  onAiGenerate,
}) => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  const user = useUserStore();

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
    canShowTopicPermissionBanner,
    setCanShowTopicPermissionBanner,
  } = useNewThreadForm(selectedCommunityId, topicsForSelector);

  const { generateComment } = useGenerateCommentText();
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

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
  }, [threadContentDelta, threadTitle]);

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

  const hasInput =
    threadTitle.trim().length > 0 ||
    getTextFromDelta(threadContentDelta).trim().length > 0;
  const buttonDisabled =
    !user.activeAccount ||
    !userSelectedAddress ||
    walletBalanceError ||
    contestTopicError ||
    (selectedCommunityId && !!disabledActionsTooltipText) ||
    isLoadingCommunity ||
    (isInsideCommunity && (!userSelectedAddress || !selectedCommunityId)) ||
    (aiCommentsToggleEnabled ? !hasInput : isDisabled);

  // Define default values for title and body
  const DEFAULT_THREAD_TITLE = 'Untitled Discussion';
  const DEFAULT_THREAD_BODY = 'No content provided.';

  const handleNewThreadCreation = async () => {
    const isAIMode = aiCommentsToggleEnabled;

    if (!community || !userSelectedAddress || !selectedCommunityId) {
      notifyError('Invalid form state!');
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
    const effectiveTitle = aiCommentsToggleEnabled
      ? threadTitle.trim() || DEFAULT_THREAD_TITLE
      : threadTitle;

    const effectiveBody = aiCommentsToggleEnabled
      ? getTextFromDelta(threadContentDelta).trim()
        ? serializeDelta(threadContentDelta)
        : DEFAULT_THREAD_BODY
      : serializeDelta(threadContentDelta);

    if (!isAIMode) {
      const deltaString = JSON.stringify(threadContentDelta);
      checkNewThreadErrors(
        { threadKind, threadUrl, threadTitle, threadTopic },
        deltaString,
        !!hasTopics,
      );
    }

    setIsSaving(true);

    try {
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
      });

      const thread = await createThread(input);

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(
        `${isInsideCommunity ? '' : `/${selectedCommunityId}`}/discussion/${thread.id}-${thread.title}`,
      );
    } catch (err) {
      if (err instanceof SessionKeyError) {
        checkForSessionKeyRevalidationErrors(err);
        return;
      }

      if (err?.message?.includes('limit')) {
        notifyError(
          'Limit of submitted threads in selected contest has been exceeded.',
        );
        return;
      }

      console.error(err?.message);
      notifyError('Failed to create thread');
    } finally {
      setIsSaving(false);
      if (!isInsideCommunity) {
        user.setData({
          addressSelectorSelectedAddress: undefined,
        });
      }
    }
  };

  const handleCancel = () => {
    console.log('NewThreadForm: invoking onCancel');
    setThreadTitle('');
    setThreadTopic(topicsForSelector.find((t) => t.name.includes('General'))!);
    setThreadContentDelta(createDeltaFromText(''));
    console.log('NewThreadForm: invoking forreal onCancel');
    onCancel();
  };

  const showBanner =
    selectedCommunityId && !userSelectedAddress && isBannerVisible;

  const contestThreadBannerVisible =
    isContestAvailable && hasTopicOngoingContest;

  const contestTopicAffordanceVisible =
    isContestAvailable && hasTopicOngoingContest;

  const handleGenerateAIThread = async () => {
    console.log('Draft thread with AI initiated');
    setIsGenerating(true);
    setThreadTitle('');
    setThreadContentDelta(createDeltaFromText(''));
    bodyAccumulatedRef.current = '';

    try {
      const bodyPromise = generateComment(
        'Generate a detailed discussion thread body',
        (chunk: string) => {
          console.log('Body stream update:', chunk);
          bodyAccumulatedRef.current += chunk;
          setThreadContentDelta(
            createDeltaFromText(bodyAccumulatedRef.current),
          );
        },
      );

      const titlePromise = generateComment(
        'Generate a single-line, concise title (max 100 characters) without quotes or punctuation at the end',
        (chunk: string) => {
          console.log('Title stream update:', chunk);
          const cleanChunk = chunk.replace(/["']/g, '').replace(/[.!?]$/, '');
          setThreadTitle((prev) =>
            prev === '' ? cleanChunk : prev + cleanChunk,
          );
        },
      );

      await Promise.all([bodyPromise, titlePromise]);
      console.log('Draft thread complete');
    } catch (error) {
      console.error('Error generating AI thread:', error);
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
        console.log('NewThreadForm: Command+Enter pressed, submitting thread.');
        void handleNewThreadCreation();
      }
    },
    [handleNewThreadCreation],
  );

  return (
    <>
      <CWPageLayout>
        <div className="NewThreadForm" onKeyDown={handleKeyDown}>
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

              {!!hasTopics && (
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

              {!!contestTopicAffordanceVisible && (
                <ContestTopicBanner
                  contests={threadTopic?.active_contest_managers?.map((acm) => {
                    return {
                      name: acm?.name,
                      address: acm?.contest_address,
                      submittedEntries:
                        acm?.content?.filter(
                          (c) => c.actor_address === userSelectedAddress,
                        ).length || 0,
                    };
                  })}
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

              {!!contestThreadBannerVisible && <ContestThreadBanner />}

              <MessageRow
                hasFeedback={!!walletBalanceError}
                statusMessage={`Ensure that your connected wallet has at least
                ${MIN_ETH_FOR_CONTEST_THREAD} ETH to participate.`}
                validationStatus="failure"
              />

              <div className="buttons-row">
                <CWButton
                  buttonType="tertiary"
                  onClick={handleCancel}
                  tabIndex={3}
                  label="Cancel"
                  containerClassName="no-pad"
                />

                <CWThreadAction
                  action="ai-reply"
                  label="Draft with AI"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Draft with AI button clicked');
                    handleGenerateAIThread();
                  }}
                />

                <div className="ai-toggle-container">
                  <CWToggle
                    checked={aiCommentsToggleEnabled}
                    onChange={() =>
                      setAICommentsToggleEnabled(!aiCommentsToggleEnabled)
                    }
                    icon="sparkle"
                    size="xs"
                    iconColor="#757575"
                  />
                  <span className="label">AI</span>
                </div>

                <CWButton
                  label="Create"
                  disabled={buttonDisabled}
                  onClick={handleNewThreadCreation}
                  tabIndex={4}
                  containerClassName="no-pad"
                />
              </div>

              {showBanner && (
                <JoinCommunityBanner
                  onClose={handleCloseBanner}
                  onJoin={handleJoinCommunity}
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
        </div>
      </CWPageLayout>
      {JoinCommunityModals}
    </>
  );
};

export default NewThreadForm;
