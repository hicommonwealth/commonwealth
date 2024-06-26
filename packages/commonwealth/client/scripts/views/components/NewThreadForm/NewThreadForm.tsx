import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import { parseCustomStages } from 'helpers';
import { detectURL, getThreadActionTooltipText } from 'helpers/threads';
import { useFlag } from 'hooks/useFlag';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import {
  useFetchGroupsQuery,
  useRefreshMembershipQuery,
} from 'state/api/groups';
import { useCreateThreadMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
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
import './NewThreadForm.scss';
import {
  checkIsTopicInContest,
  checkNewThreadErrors,
  useNewThreadForm,
} from './helpers';

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();
  const location = useLocation();
  const contestsEnabled = useFlag('contest');

  const [submitEntryChecked, setSubmitEntryChecked] = useState(false);

  const { isAddedToHomeScreen } = useAppStatus();

  const { data: topics = [] } = useFetchTopicsQuery({
    communityId: app.activeChainId(),
  });

  const { contestsData, isContestAvailable } = useCommunityContests();

  const sortedTopics = [...topics].sort((a, b) => a.name.localeCompare(b.name));
  const communityId = app.chain.id;
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

  const isTopicInContest = checkIsTopicInContest(contestsData, threadTopic?.id);

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId: app.activeChainId(),
    includeTopics: true,
  });
  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const {
    mutateAsync: createThread,
    error: createThreadError,
    reset: resetCreateThreadMutation,
  } = useCreateThreadMutation({
    communityId: app.activeChainId(),
  });

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetCreateThreadMutation,
    error: createThreadError,
  });

  const isDiscussion = threadKind === ThreadKind.Discussion;

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
  }, [threadContentDelta, threadTitle]);

  const isTopicGated = !!(memberships || []).find((membership) =>
    membership.topicIds.includes(threadTopic?.id),
  );
  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      membership.topicIds.includes(threadTopic?.id) && membership.isAllowed,
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
      const thread = await createThread({
        address: app.user.activeAccount.address,
        kind: threadKind,
        stage: app.chain.meta.customStages
          ? parseCustomStages(app.chain.meta.customStages)[0]
          : ThreadStage.Discussion,
        communityId: app.activeChainId(),
        title: threadTitle,
        topic: threadTopic,
        body: serializeDelta(threadContentDelta),
        url: threadUrl,
        // @ts-expect-error <StrictNullChecks/>
        authorProfile: app.user.activeAccount.profile,
        isPWA: isAddedToHomeScreen,
      });

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${thread.id}`);
    } catch (err) {
      if (err instanceof SessionKeyError) {
        return;
      }
      console.error(err.response.data.error || err?.message);
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

  const showBanner = !hasJoinedCommunity && isBannerVisible;
  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!hasJoinedCommunity,
    isThreadTopicGated: isRestrictedMembership,
  });

  const contestThreadBannerVisible =
    contestsEnabled && isContestAvailable && isTopicInContest;
  const isDisabledBecauseOfContestsConsent =
    contestThreadBannerVisible && !submitEntryChecked;

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
                  onChange={(topic) => {
                    setCanShowGatingBanner(true);
                    setThreadTopic(
                      // @ts-expect-error <StrictNullChecks/>
                      topicsForSelector.find((t) => `${t.id}` === topic.value),
                    );
                  }}
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
                isDisabled={isRestrictedMembership || !hasJoinedCommunity}
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

              <div className="buttons-row">
                {isPopulated && hasJoinedCommunity && (
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
                    !hasJoinedCommunity ||
                    isDisabledBecauseOfContestsConsent
                  }
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
            </div>
          </div>
        </div>
      </CWPageLayout>
      {JoinCommunityModals}
      {RevalidationModal}
    </>
  );
};
