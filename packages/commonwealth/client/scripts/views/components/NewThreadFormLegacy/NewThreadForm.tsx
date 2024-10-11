import { buildCreateThreadInput } from 'client/scripts/state/api/threads/createThread';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import { parseCustomStages } from 'helpers';
import { detectURL, getThreadActionTooltipText } from 'helpers/threads';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { useGetUserEthBalanceQuery } from 'state/api/communityStake';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from 'state/api/groups';
import { useCreateThreadMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
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
import Permissions from '../../../utils/Permissions';
import { CWText } from '../../components/component_kit/cw_text';
import { CWGatedTopicBanner } from '../component_kit/CWGatedTopicBanner';
import { CWSelectList } from '../component_kit/new_designs/CWSelectList';
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

const MIN_ETH_FOR_CONTEST_THREAD = 0.0005;

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();

  const [submitEntryChecked, setSubmitEntryChecked] = useState(false);

  useAppStatus();

  const communityId = app.activeChainId() || '';
  const { data: topics = [], refetch: refreshTopics } = useFetchTopicsQuery({
    communityId,
    includeContestData: true,
    apiEnabled: !!communityId,
  });

  const { isContestAvailable } = useCommunityContests();

  const sortedTopics = [...topics].sort((a, b) => a.name.localeCompare(b.name));
  const hasTopics = sortedTopics?.length;
  const isAdmin = Permissions.isCommunityAdmin() || Permissions.isSiteAdmin();
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
  } = useNewThreadForm(communityId, topicsForSelector);

  const hasTopicOngoingContest = threadTopic?.activeContestManagers?.length > 0;

  const user = useUserStore();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const contestTopicError = threadTopic?.activeContestManagers?.length
    ? threadTopic?.activeContestManagers
        ?.map(
          (acm) =>
            acm?.content?.filter(
              (c) => c.actor_address === user.activeAccount?.address,
            ).length || 0,
        )
        ?.every((n) => n >= 2)
    : false;

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId,
    includeTopics: true,
    enabled: !!communityId,
  });
  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId,
    address: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address && !!communityId,
  });

  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId,
  });

  const chainRpc = app?.chain?.meta?.ChainNode?.url || '';
  const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;

  const { data: userEthBalance } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: user.activeAccount?.address || '',
    apiEnabled:
      isContestAvailable &&
      !!user.activeAccount?.address &&
      Number(ethChainId) > 0,
    ethChainId: ethChainId || 0,
  });

  const isDiscussion = threadKind === ThreadKind.Discussion;

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
  }, [threadContentDelta, threadTitle]);

  const isTopicGated = !!(memberships || []).find(
    (membership) =>
      threadTopic?.id && membership.topicIds.includes(threadTopic.id),
  );
  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      threadTopic &&
      threadTopic?.id &&
      membership.topicIds.includes(threadTopic?.id) &&
      membership.isAllowed,
  );
  const gatedGroupNames = groups
    .filter((group) =>
      group.topics.find((topic) => topic.id === threadTopic?.id),
    )
    .map((group) => group.name);
  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

  const handleNewThreadCreation = async () => {
    if (isRestrictedMembership) {
      notifyError('Topic is gated!');
      return;
    }

    if (!isDiscussion && !detectURL(threadUrl)) {
      notifyError('Must provide a valid URL.');
      return;
    }

    const deltaString = JSON.stringify(threadContentDelta);

    checkNewThreadErrors(
      { threadKind, threadUrl, threadTitle, threadTopic },
      deltaString,
      !!hasTopics,
    );

    setIsSaving(true);

    try {
      const input = await buildCreateThreadInput({
        address: user.activeAccount?.address || '',
        kind: threadKind,
        stage: app.chain.meta?.custom_stages
          ? parseCustomStages(app.chain.meta?.custom_stages)[0]
          : ThreadStage.Discussion,
        communityId,
        title: threadTitle,
        topic: threadTopic,
        body: serializeDelta(threadContentDelta),
        url: threadUrl,
      });
      const thread = await createThread(input);

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${thread.id}`);
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
    }
  };

  const handleCancel = () => {
    setThreadTitle('');
    setThreadTopic(
      // @ts-expect-error <StrictNullChecks/>
      topicsForSelector?.find((t) => t?.name?.includes('General')) || null,
    );
    setThreadContentDelta(createDeltaFromText(''));
  };

  const showBanner = !user.activeAccount && isBannerVisible;
  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!user.activeAccount,
    isThreadTopicGated: isRestrictedMembership,
  });

  const contestThreadBannerVisible =
    isContestAvailable && hasTopicOngoingContest;
  const isDisabledBecauseOfContestsConsent =
    contestThreadBannerVisible && !submitEntryChecked;

  const contestTopicAffordanceVisible =
    isContestAvailable && hasTopicOngoingContest;

  const walletBalanceError =
    isContestAvailable &&
    hasTopicOngoingContest &&
    parseFloat(userEthBalance || '0') < MIN_ETH_FOR_CONTEST_THREAD;

  useEffect(() => {
    refreshTopics().catch(console.error);
  }, [refreshTopics]);

  return (
    <>
      <CWPageLayout>
        <div className="NewThreadForm">
          <CWText type="h2" fontWeight="medium" className="header">
            Create thread
          </CWText>
          <div className="new-thread-body">
            <div className="new-thread-form-inputs">
              <CWTextInput
                fullWidth
                autoFocus
                placeholder="Title"
                value={threadTitle}
                tabIndex={1}
                onInput={(e) => setThreadTitle(e.target.value)}
              />

              {!!hasTopics && (
                <CWSelectList
                  className="topic-select"
                  components={{
                    // eslint-disable-next-line react/no-multi-comp
                    Option: (originalProps) =>
                      CustomTopicOption({
                        originalProps,
                        topic: topicsForSelector.find(
                          (t) => String(t.id) === originalProps.data.value,
                        ),
                      }),
                  }}
                  formatOptionLabel={(option) => (
                    <>
                      {contestTopicAffordanceVisible && (
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
                      defaultValue: {
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
                    setCanShowGatingBanner(true);
                    setThreadTopic(
                      // @ts-expect-error <StrictNullChecks/>
                      topicsForSelector.find((t) => `${t.id}` === topic.value),
                    );
                  }}
                />
              )}

              {contestTopicAffordanceVisible && (
                <ContestTopicBanner
                  contests={threadTopic?.activeContestManagers.map((acm) => {
                    return {
                      name: acm?.contest_manager?.name,
                      address: acm?.contest_manager?.contest_address,
                      submittedEntries:
                        acm?.content?.filter(
                          (c) =>
                            c.actor_address === user.activeAccount?.address,
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
                isDisabled={isRestrictedMembership || !user.activeAccount}
                tooltipLabel={
                  typeof disabledActionsTooltipText === 'function'
                    ? disabledActionsTooltipText?.('submit')
                    : disabledActionsTooltipText
                }
                placeholder="Enter text or drag images and media here. Use the tab button to see your formatted post."
              />

              {contestThreadBannerVisible && (
                <ContestThreadBanner
                  submitEntryChecked={submitEntryChecked}
                  onSetSubmitEntryChecked={setSubmitEntryChecked}
                />
              )}

              <MessageRow
                hasFeedback={walletBalanceError}
                statusMessage={`Ensure that your connected wallet has at least
                ${MIN_ETH_FOR_CONTEST_THREAD} ETH to participate.`}
                validationStatus="failure"
              />

              <div className="buttons-row">
                {isPopulated && user.activeAccount && (
                  <CWButton
                    buttonType="tertiary"
                    onClick={handleCancel}
                    tabIndex={3}
                    label="Cancel"
                    containerClassName="no-pad"
                  />
                )}
                <CWButton
                  label="Create thread"
                  disabled={
                    isDisabled ||
                    !user.activeAccount ||
                    isDisabledBecauseOfContestsConsent ||
                    walletBalanceError ||
                    contestTopicError
                  }
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={handleNewThreadCreation}
                  tabIndex={4}
                  containerClassName="no-pad"
                />
              </div>

              {showBanner && (
                <JoinCommunityBanner
                  onClose={handleCloseBanner}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
            </div>
          </div>
        </div>
      </CWPageLayout>
      {JoinCommunityModals}
    </>
  );
};
